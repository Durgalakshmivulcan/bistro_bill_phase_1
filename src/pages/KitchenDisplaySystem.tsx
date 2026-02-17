import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { KDSOrder, KDSOrderItem, KDSColumn } from "../types/kds";
import OrderCard from "../components/Cards/OrderCard";
import { useNavigate } from "react-router-dom";
import { getKDSBoard, KDSBoardResponse } from "../services/kdsService";
import { getKitchens, getBranches, Branch } from "../services/branchService";
import { LoadingSpinner } from "../components/Common";
import { useAuth } from "../contexts/AuthContext";
import { startPollTimer, getAdaptiveInterval, getMetrics } from "../utils/performanceMonitor";
import { useWebSocket, WS_FALLBACK_TO_POLLING } from "../hooks/useWebSocket";
import { WebSocketEventType, OrderCreatedPayload, KotStatusChangedPayload, OrderUpdatedPayload } from "../types/websocket.types";
import ConnectionStatus from "../components/Common/ConnectionStatus";

const formatCurrentDate = (): string => {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const getUserDisplayName = (user: any): string => {
  if (!user) return "User";
  switch (user.userType) {
    case "Staff":
      return `${user.firstName} ${user.lastName}`.trim() || "Staff";
    case "BusinessOwner":
      return user.ownerName || "Owner";
    case "SuperAdmin":
      return user.name || "Admin";
    default:
      return "User";
  }
};

const getUserRole = (user: any): string => {
  if (!user) return "Staff";
  switch (user.userType) {
    case "Staff":
      return user.role?.name || "Staff";
    case "BusinessOwner":
      return "Business Owner";
    case "SuperAdmin":
      return "Super Admin";
    default:
      return "Staff";
  }
};

const KitchenDisplaySystem = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kdsColumns, setKdsColumns] = useState<KDSColumn[]>([]);
  const [kitchens, setKitchens] = useState<any[]>([]);
  const [selectedKitchenId, setSelectedKitchenId] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousCountsRef = useRef<{ totalNew: number; totalPreparing: number }>({ totalNew: 0, totalPreparing: 0 });
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [recentlyUpdatedOrders, setRecentlyUpdatedOrders] = useState<Set<string>>(new Set());
  const [wsFallbackActive, setWsFallbackActive] = useState(false);

  // Dynamic date that updates on every render/polling cycle
  const currentDate = useMemo(() => formatCurrentDate(), [lastUpdated]);
  const displayName = useMemo(() => getUserDisplayName(user), [user]);
  const userRole = useMemo(() => getUserRole(user), [user]);

  // Initialize audio notification
  useEffect(() => {
    // Create audio element for notification sound
    // Using a simple beep sound data URL (can be replaced with actual sound file)
    const audio = new Audio();
    // Simple notification beep using Web Audio API fallback or data URL
    // For production, replace with actual sound file path like '/sounds/notification.mp3'
    audio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTUIGWi77eefTRAMUKfj8LZjHAY4ktfyy3ksBCR3x/DdkEAKFF606OuoVRQKRp/g8r5sIQUrg87y2Ik1CBlou+3nn00QDFC";
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Request browser notification permission on page load (once)
  useEffect(() => {
    if (!('Notification' in window)) return;

    const alreadyAsked = localStorage.getItem('kds_notification_permission_asked');

    if (Notification.permission === 'default' && !alreadyAsked) {
      Notification.requestPermission().then(() => {
        localStorage.setItem('kds_notification_permission_asked', 'true');
      });
    }
  }, []);

  // Show browser notification for new orders
  const showBrowserNotification = (orderNumber: string, tableName?: string) => {
    if (!isSoundEnabled) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const tableInfo = tableName ? ` - ${tableName}` : '';
    const notification = new Notification(`New Order #${orderNumber}${tableInfo}`, {
      body: 'A new order has been placed in the kitchen.',
      icon: '/logo.png',
      tag: `order-${orderNumber}`,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  // Play notification sound
  const playNotificationSound = () => {
    if (isSoundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.warn("Failed to play notification sound:", err);
      });
    }
  };

  // Handle ORDER_UPDATED event: update specific order card or remove it
  const handleOrderUpdated = useCallback((payload: OrderUpdatedPayload) => {
    const { orderNumber, status } = payload;
    const removedStatuses = ['Completed', 'Cancelled'];

    setKdsColumns((prevColumns) => {
      if (removedStatuses.includes(status)) {
        // Remove the order from whichever column it's in
        return prevColumns.map((col) => {
          const filteredOrders = col.orders.filter((o) => o.id !== orderNumber);
          if (filteredOrders.length !== col.orders.length) {
            // Update column title count
            const countMatch = col.title.match(/\((\d+)\)/);
            const currentCount = countMatch ? parseInt(countMatch[1], 10) : filteredOrders.length;
            const newCount = Math.max(0, currentCount - (col.orders.length - filteredOrders.length));
            const newTitle = col.title.replace(/\(\d+\)/, `(${newCount})`);
            return { ...col, orders: filteredOrders, title: newTitle };
          }
          return col;
        });
      }

      // For non-removal status changes, reload the board to get fresh data
      // but also mark the order as recently updated for the flash animation
      return prevColumns;
    });

    if (!removedStatuses.includes(status)) {
      // Reload the board to get fresh data for status changes
      loadKDSBoard(true);
    }

    // Mark the order as recently updated for flash animation
    setRecentlyUpdatedOrders((prev) => new Set(prev).add(orderNumber));

    // Clear the flash animation after 2 seconds
    setTimeout(() => {
      setRecentlyUpdatedOrders((prev) => {
        const next = new Set(prev);
        next.delete(orderNumber);
        return next;
      });
    }, 2000);
  }, []);

  // Transform API response to match OrderCard component expectations
  const transformKOTToOrder = (kot: any): KDSOrder & { kotId: string; orderId: string } => {
    const order = kot.order;
    const tableInfo = order.table
      ? `Table No: ${order.table.label} | ${order.table.floor?.name || "Unknown"}`
      : "-";

    // Format elapsed time as MM:SS
    const elapsedMinutes = kot.elapsedMinutes || 0;
    const minutes = Math.floor(elapsedMinutes);
    const seconds = Math.floor((elapsedMinutes - minutes) * 60);
    const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    // Transform items
    const mockItems: KDSOrderItem[] = order.items.map((item: any) => {
      let statusMap: "ready" | "preparing" | "normal" = "normal";
      if (item.status === "Ready") statusMap = "ready";
      else if (item.status === "Preparing") statusMap = "preparing";

      const variant = item.variant
        ? `${item.variant.name} (${item.variant.sku || ""})`
        : undefined;

      return {
        name: item.name,
        variant,
        qty: item.quantity,
        status: statusMap,
      };
    });

    return {
      id: order.orderNumber,
      time: timeStr,
      orderTime: new Date(kot.createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      kot: kot.kotNumber,
      type: order.type || "Dine In",
      source: "Bistro Bill",
      table: tableInfo,
      items: mockItems,
      kotId: kot.id,
      orderId: order.id,
    };
  };

  // Load branches and initialize selected branch
  useEffect(() => {
    const loadBranchesAndInit = async () => {
      try {
        const response = await getBranches({ status: "Active" });
        if (response.success && response.data) {
          setBranches(response.data.branches);

          // Get stored branch ID or use first branch
          const storedBranchId = localStorage.getItem("selectedBranchId");
          if (storedBranchId && response.data.branches.some(b => b.id === storedBranchId)) {
            setSelectedBranchId(storedBranchId);
          } else if (response.data.branches.length > 0) {
            const firstBranchId = response.data.branches[0].id;
            setSelectedBranchId(firstBranchId);
            localStorage.setItem("selectedBranchId", firstBranchId);
          } else {
            setError("No active branches found. Please contact your administrator.");
          }
        } else {
          setError("Failed to load branches. Please try again.");
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
        setError("Failed to load branches. Please check your connection.");
      }
    };
    loadBranchesAndInit();
  }, []);

  // Load kitchens when branch changes
  useEffect(() => {
    if (!selectedBranchId) return;

    const loadKitchens = async () => {
      try {
        const response = await getKitchens(selectedBranchId);
        if (response.success && response.data) {
          setKitchens(response.data.kitchens);
          if (response.data.kitchens.length > 0) {
            setSelectedKitchenId(response.data.kitchens[0].id);
          } else {
            setError("No kitchens found for this branch. Please contact your administrator.");
          }
        } else {
          setError("Failed to load kitchens. Please try again.");
        }
      } catch (err) {
        console.error("Failed to load kitchens:", err);
        setError("Failed to load kitchens. Please check your connection.");
      }
    };
    loadKitchens();
  }, [selectedBranchId]);

  // Load KDS board when kitchen changes
  useEffect(() => {
    loadKDSBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKitchenId]);

  // WebSocket connection for real-time KDS updates
  const { status: wsStatus, retryCount: wsRetryCount, lastConnectedAt: wsLastConnected, subscribe } = useWebSocket();

  // Subscribe to WebSocket events for real-time updates
  useEffect(() => {
    if (wsStatus !== 'connected' || !selectedKitchenId) return;

    // On ORDER_CREATED, reload board + play sound (if tab hidden) + show browser notification
    const unsubOrderCreated = subscribe<OrderCreatedPayload>(
      WebSocketEventType.ORDER_CREATED,
      (payload) => {
        loadKDSBoard(true);

        // Play sound only when tab is NOT visible (in background)
        if (document.hidden) {
          playNotificationSound();
        }

        // Show browser notification with order details
        showBrowserNotification(payload.orderNumber, payload.tableName);
      }
    );

    const unsubKotChanged = subscribe<KotStatusChangedPayload>(
      WebSocketEventType.KOT_STATUS_CHANGED,
      () => {
        loadKDSBoard(true);
      }
    );

    const unsubOrderUpdated = subscribe<OrderUpdatedPayload>(
      WebSocketEventType.ORDER_UPDATED,
      (payload) => {
        handleOrderUpdated(payload);
      }
    );

    return () => {
      unsubOrderCreated();
      unsubKotChanged();
      unsubOrderUpdated();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsStatus, selectedKitchenId, subscribe, handleOrderUpdated]);

  // Listen for fallback-to-polling event when WebSocket fails permanently
  useEffect(() => {
    const unsubFallback = subscribe(WS_FALLBACK_TO_POLLING, () => {
      setWsFallbackActive(true);
    });

    return () => {
      unsubFallback();
    };
  }, [subscribe]);

  // Reset fallback when WebSocket reconnects
  useEffect(() => {
    if (wsStatus === 'connected') {
      setWsFallbackActive(false);
    }
  }, [wsStatus]);

  // Fallback polling when WebSocket is not connected or fallback is active (30s interval for fallback, 60s otherwise)
  useEffect(() => {
    if (!selectedKitchenId) return;
    if (wsStatus === 'connected' && !wsFallbackActive) return;

    const FALLBACK_INTERVAL = wsFallbackActive ? 30000 : 60000;
    const timer = setInterval(() => {
      loadKDSBoard(true);
    }, FALLBACK_INTERVAL);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKitchenId, wsStatus, wsFallbackActive]);

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBranchId = e.target.value;
    setSelectedBranchId(newBranchId);
    localStorage.setItem("selectedBranchId", newBranchId);
  };

  const handleKitchenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedKitchenId(e.target.value);
  };

  const handleRefresh = () => {
    // Trigger reload by re-fetching the board
    if (selectedKitchenId) {
      loadKDSBoard();
    }
  };

  const loadKDSBoard = async (isAutoRefresh = false) => {
    if (!selectedKitchenId) return;

    // Only show loading spinner on manual refresh, not auto-refresh
    if (!isAutoRefresh) {
      setLoading(true);
    }
    setError(null);

    const endTimer = startPollTimer('KDS /kds/orders');

    try {
      const response = await getKDSBoard(selectedKitchenId);
      if (response.success && response.data) {
        const data: KDSBoardResponse = response.data;

        // Calculate new orders count (for badge indicator)
        const currentNewCount = data.summary.totalNew;
        const currentPreparingCount = data.summary.totalPreparing;
        const prevCounts = previousCountsRef.current;

        if (isAutoRefresh && (prevCounts.totalNew > 0 || prevCounts.totalPreparing > 0)) {
          // Only notify when new orders arrive (totalNew increases)
          if (currentNewCount > prevCounts.totalNew) {
            const newOrdersDiff = currentNewCount - prevCounts.totalNew;
            setNewOrdersCount(newOrdersDiff);
            playNotificationSound();
            setTimeout(() => setNewOrdersCount(0), 5000);
          }
        }

        // Always update previous counts ref
        previousCountsRef.current = { totalNew: currentNewCount, totalPreparing: currentPreparingCount };

        // Transform grouped data into columns
        const columns: KDSColumn[] = [
          {
            key: "new",
            title: `New Orders (${data.summary.totalNew})`,
            borderColor: "border-blue-500",
            headerBg: "bg-blue-50",
            orders: data.groupedByStatus.New.map(transformKOTToOrder),
          },
          {
            key: "ready",
            title: `Orders Ready (${data.summary.totalReady})`,
            borderColor: "border-green-500",
            headerBg: "bg-green-50",
            orders: data.groupedByStatus.Ready.map(transformKOTToOrder),
          },
          {
            key: "served",
            title: `Orders Served (${data.summary.totalServed || 0})`,
            borderColor: "border-gray-500",
            headerBg: "bg-gray-50",
            orders: (data.groupedByStatus.Served || []).map(transformKOTToOrder),
          },
          {
            key: "cancelled",
            title: `Cancelled Orders (${data.summary.totalCancelled || 0})`,
            borderColor: "border-red-500",
            headerBg: "bg-red-50",
            orders: (data.groupedByStatus.Cancelled || []).map(transformKOTToOrder),
          },
        ];

        // Add "Preparing" orders to "New" column (since both are active)
        const preparingOrders = data.groupedByStatus.Preparing.map(transformKOTToOrder);
        columns[0].orders = [...columns[0].orders, ...preparingOrders];
        columns[0].title = `New Orders (${data.summary.totalNew + data.summary.totalPreparing})`;

        setKdsColumns(columns);
        setLastUpdated(new Date());
      }
      endTimer(true);
    } catch (err: any) {
      endTimer(false);
      console.error("Failed to load KDS board:", err);
      if (!isAutoRefresh) {
        setError(err.message || "Failed to load KDS board");
      }
    } finally {
      if (!isAutoRefresh) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-bb-bg min-h-screen">

      {/* ================= TOP HEADER (LOGO ROW) ================= */}
      <header className="w-full bg-bb-bg">
        <div className="flex items-center justify-between px-4 lg:px-6 h-[64px]">

          {/* LEFT */}
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-12 h-12 object-contain"
            />
            <span className="font-semibold text-sm sm:text-base">
              Bistro Bill
            </span>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">
            {/* Date */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 border border-bb-border rounded-md text-sm">
              <i className="bi bi-calendar3" />
              {currentDate}
            </div>

            {/* Notification */}
            <div className="relative">
              <i className="bi bi-bell text-lg cursor-pointer" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                2
              </span>
            </div>

            {/* User */}
            <div className="flex items-center gap-2">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  className="w-9 h-9 rounded-full object-cover"
                  alt={displayName}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={`w-9 h-9 rounded-full bg-bb-primary flex items-center justify-center text-sm font-semibold text-bb-text ${user?.avatar ? "hidden" : ""}`}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block leading-tight">
                <div className="text-sm font-medium">{displayName}</div>
                <div className="text-xs text-bb-muted">
                  {userRole}
                </div>
              </div>
              <i className="bi bi-chevron-down text-xs" />
            </div>
          </div>
        </div>
      </header>

      {/* ================= SECOND ROW (KDS CONTROLS) ================= */}
      <div className="px-4 lg:px-6 mt-3 flex justify-between items-center">

        {/* LEFT */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="text-lg"
          >
            ←
          </button>

          <h1 className="text-xl font-semibold">
            Kitchen Display System
          </h1>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          {/* WebSocket Connection Status Indicator */}
          <ConnectionStatus
            status={wsStatus}
            lastUpdateTime={wsLastConnected}
            retryCount={wsRetryCount}
          />

          {/* Last Updated Timestamp + Latency (dev only) */}
          {lastUpdated && (
            <div className="hidden md:flex items-center gap-2 px-3 py-2 border border-bb-border rounded-md text-xs text-bb-textSoft">
              <i className="bi bi-clock" />
              Updated: {lastUpdated.toLocaleTimeString()}
              {process.env.NODE_ENV === 'development' && getMetrics('KDS /kds/orders') && (
                <span className={`ml-1 ${(getMetrics('KDS /kds/orders')?.lastLatency || 0) > 2000 ? 'text-red-500 font-semibold' : 'text-green-600'}`}>
                  ({getMetrics('KDS /kds/orders')?.lastLatency}ms)
                </span>
              )}
            </div>
          )}

          {/* New Orders Indicator */}
          {newOrdersCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 border border-green-500 bg-green-50 rounded-md text-xs text-green-700 font-medium animate-pulse">
              <i className="bi bi-bell-fill" />
              {newOrdersCount} New Order{newOrdersCount > 1 ? 's' : ''}!
            </div>
          )}

          {/* Branch Selector */}
          <select
            className="px-3 py-2 text-sm rounded-md border border-bb-border bg-bb-bg"
            value={selectedBranchId}
            onChange={handleBranchChange}
            disabled={loading || branches.length === 0}
          >
            {branches.length > 0 ? (
              branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))
            ) : (
              <option value="">Select Branch</option>
            )}
          </select>

          {/* Kitchen Selector */}
          <select
            className="px-3 py-2 text-sm rounded-md border border-bb-border bg-bb-bg"
            value={selectedKitchenId}
            onChange={handleKitchenChange}
            disabled={loading || !selectedBranchId}
          >
            {kitchens.length > 0 ? (
              kitchens.map((kitchen) => (
                <option key={kitchen.id} value={kitchen.id}>
                  {kitchen.name}
                </option>
              ))
            ) : (
              <option value="">Select Kitchen</option>
            )}
          </select>

          {/* Sound Toggle */}
          <button
            className={`w-9 h-9 flex items-center justify-center rounded-md border ${
              isSoundEnabled
                ? "bg-bb-primary text-bb-text border-bb-primary"
                : "bg-white text-bb-textSoft border-bb-border"
            } hover:opacity-80`}
            title={isSoundEnabled ? "Mute Notifications" : "Enable Notifications"}
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
          >
            <i className={`bi ${isSoundEnabled ? "bi-volume-up-fill" : "bi-volume-mute-fill"}`} />
          </button>

          {/* Refresh */}
          <button
            className="w-9 h-9 flex items-center justify-center rounded-md bg-black text-white hover:bg-gray-800 disabled:opacity-50"
            title="Refresh"
            onClick={handleRefresh}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise" />
          </button>
        </div>
      </div>

      {/* ================= FALLBACK WARNING BANNER ================= */}
      {wsFallbackActive && (
        <div className="mx-4 lg:mx-6 mt-2 px-4 py-2 bg-amber-50 border border-amber-300 rounded-md flex items-center gap-2 text-sm text-amber-800">
          <i className="bi bi-exclamation-triangle-fill" />
          <span>Live updates unavailable - using 30 second refresh</span>
        </div>
      )}

      {/* ================= KDS BOARD ================= */}
      <div className="p-4">
        {loading && (
          <div className="flex items-center justify-center h-[calc(100vh-140px)]">
            <LoadingSpinner size="lg" message="Loading KDS board..." />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-[calc(100vh-140px)]">
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
              Error: {error}
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-140px)]">
            {kdsColumns.map((column) => (
              <div key={column.key} className="flex flex-col rounded-md">
                <div
                  className="p-2 font-semibold text-sm rounded-t-md"
                  style={{ backgroundColor: "#EDE7D4" }}
                >
                  {column.title}
                </div>

                <div
                  className="p-2 space-y-3 overflow-y-auto rounded-b-md"
                  style={{ backgroundColor: "#EDE7D4" }}
                >
                  {column.orders.map((order) => (
                    <div
                      key={order.id}
                      className={recentlyUpdatedOrders.has(order.id) ? 'animate-ws-flash rounded-md' : ''}
                    >
                      <OrderCard
                        order={order}
                        kotId={(order as any).kotId}
                        orderId={(order as any).orderId}
                        onStatusUpdate={loadKDSBoard}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDisplaySystem;