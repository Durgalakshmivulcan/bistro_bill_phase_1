import { Prisma } from '@prisma/client';
import { prisma } from '../db.service';

/**
 * CCTV/Security System Integration Service (US-260)
 *
 * Links orders to CCTV camera footage based on table location and order timestamp.
 * Stores camera configurations in SecurityCamera table.
 * Generates playback URLs for reviewing footage tied to specific orders.
 */

interface CctvConfig {
  nvrHost: string; // NVR/DVR host address
  nvrPort: number; // NVR/DVR port
  protocol: string; // http, rtsp, onvif
  username?: string; // NVR login username
  password?: string; // NVR login password
  playbackPathTemplate?: string; // URL template for playback, e.g., "/playback?camera={{cameraId}}&start={{start}}&end={{end}}"
}

export interface SecurityCameraInfo {
  id: string;
  name: string;
  location: string;
  cameraId: string;
  status: string;
}

export interface FootageLinkResult {
  success: boolean;
  message: string;
  playbackUrl?: string;
  cameraName?: string;
  cameraLocation?: string;
  startTime?: string;
  endTime?: string;
}

export interface CameraListResult {
  success: boolean;
  message: string;
  cameras?: SecurityCameraInfo[];
}

/**
 * Find the CCTV integration for a business owner.
 */
async function findIntegration(businessOwnerId: string) {
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider: 'cctv',
      },
    },
  });

  if (!integration || integration.status !== 'active') {
    return null;
  }

  return integration;
}

/**
 * Log an action to IntegrationLog.
 */
async function logAction(
  integrationId: string,
  action: string,
  status: string,
  requestPayload: Record<string, unknown> | null,
  responsePayload: Record<string, unknown> | null,
  errorMessage: string | null
): Promise<void> {
  try {
    await prisma.integrationLog.create({
      data: {
        integrationId,
        action,
        status,
        requestPayload: requestPayload
          ? JSON.parse(JSON.stringify(requestPayload))
          : Prisma.JsonNull,
        responsePayload: responsePayload
          ? JSON.parse(JSON.stringify(responsePayload))
          : Prisma.JsonNull,
        errorMessage,
      },
    });
  } catch {
    console.error('[CCTV] Failed to write IntegrationLog');
  }
}

/**
 * Get all security cameras for a branch.
 */
export async function getCameras(
  businessOwnerId: string,
  branchId: string
): Promise<CameraListResult> {
  try {
    const cameras = await prisma.securityCamera.findMany({
      where: {
        businessOwnerId,
        branchId,
        status: 'active',
      },
      orderBy: { location: 'asc' },
    });

    return {
      success: true,
      message: `Found ${cameras.length} camera(s)`,
      cameras: cameras.map((cam) => ({
        id: cam.id,
        name: cam.name,
        location: cam.location,
        cameraId: cam.cameraId,
        status: cam.status,
      })),
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error fetching cameras';
    return { success: false, message: msg };
  }
}

/**
 * Generate a footage playback link for a specific camera, timestamp, and duration.
 *
 * The playback URL is constructed from the camera's NVR configuration:
 *   {protocol}://{nvrHost}:{nvrPort}{playbackPathTemplate}
 *
 * Template variables: {{cameraId}}, {{start}}, {{end}}
 */
export async function getFootageLink(
  cameraId: string,
  timestamp: Date,
  durationMinutes: number,
  businessOwnerId: string
): Promise<FootageLinkResult> {
  const camera = await prisma.securityCamera.findFirst({
    where: { id: cameraId, businessOwnerId },
  });

  if (!camera) {
    return { success: false, message: `Camera not found: ${cameraId}` };
  }

  if (camera.status !== 'active') {
    return { success: false, message: `Camera is not active: ${camera.name}` };
  }

  const integration = await findIntegration(businessOwnerId);

  // Use camera-level config or fall back to integration-level config
  const nvrHost = camera.nvrHost || (integration?.config as unknown as CctvConfig)?.nvrHost;
  const nvrPort = camera.nvrPort || (integration?.config as unknown as CctvConfig)?.nvrPort || 80;
  const protocol = camera.protocol || (integration?.config as unknown as CctvConfig)?.protocol || 'http';

  if (!nvrHost) {
    return { success: false, message: 'NVR host is not configured for this camera or integration' };
  }

  const startTime = new Date(timestamp);
  const endTime = new Date(timestamp.getTime() + durationMinutes * 60 * 1000);

  const startISO = startTime.toISOString();
  const endISO = endTime.toISOString();

  // Build playback URL from template or use default path
  const configTemplate = (integration?.config as unknown as CctvConfig)?.playbackPathTemplate;
  const pathTemplate = configTemplate || '/playback?camera={{cameraId}}&start={{start}}&end={{end}}';

  const playbackPath = pathTemplate
    .replace('{{cameraId}}', encodeURIComponent(camera.cameraId))
    .replace('{{start}}', encodeURIComponent(startISO))
    .replace('{{end}}', encodeURIComponent(endISO));

  const playbackUrl = `${protocol}://${nvrHost}:${nvrPort}${playbackPath}`;

  // Log the action if integration exists
  if (integration) {
    await logAction(
      integration.id,
      'get_footage_link',
      'success',
      { cameraId: camera.cameraId, timestamp: startISO, durationMinutes },
      { playbackUrl },
      null
    );

    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });
  }

  return {
    success: true,
    message: `Footage link generated for ${camera.name}`,
    playbackUrl,
    cameraName: camera.name,
    cameraLocation: camera.location,
    startTime: startISO,
    endTime: endISO,
  };
}

/**
 * Link camera footage to an order based on the order's table location and timestamp.
 *
 * Looks up the order's branch and table/floor, then finds matching cameras
 * at the same location. Returns playback links for all relevant cameras.
 */
export async function getOrderFootage(
  orderId: string,
  businessOwnerId: string,
  durationMinutes: number = 30
): Promise<{
  success: boolean;
  message: string;
  footage: FootageLinkResult[];
}> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      branch: true,
    },
  });

  if (!order) {
    return { success: false, message: `Order not found: ${orderId}`, footage: [] };
  }

  if (!order.branchId) {
    return { success: false, message: 'Order has no associated branch', footage: [] };
  }

  // Find all active cameras in the order's branch
  const cameras = await prisma.securityCamera.findMany({
    where: {
      businessOwnerId,
      branchId: order.branchId,
      status: 'active',
    },
  });

  if (cameras.length === 0) {
    return { success: false, message: 'No active cameras found for this branch', footage: [] };
  }

  // Generate footage links for all cameras in the branch
  const orderTimestamp = order.createdAt;
  const footageResults: FootageLinkResult[] = [];

  for (const camera of cameras) {
    const result = await getFootageLink(
      camera.id,
      orderTimestamp,
      durationMinutes,
      businessOwnerId
    );
    footageResults.push(result);
  }

  const successCount = footageResults.filter((f) => f.success).length;

  return {
    success: successCount > 0,
    message: `Generated ${successCount} footage link(s) from ${cameras.length} camera(s)`,
    footage: footageResults,
  };
}
