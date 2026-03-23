import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import DiscountSection from "../components/POSViewOrder/DiscountSectionView";
import OrderDetailsCard from "../components/POSViewOrder/OrderDetailsCard";
import { useNavigate } from "react-router-dom";
import OnlineOrderQueue from "../components/POSTakeOrder/OnlineOrderQueue";
import POSHeader from "../layout/POSHeader";
import { getTableStatusOverview, FloorWithTables, TableStatus } from "../services/orderService";
import { showSuccessToast, showErrorToast, showWarningToast } from "../utils/toast";
import { useAuth } from "../contexts/AuthContext";
import { useBranch } from "../contexts/BranchContext";
import { updateTableStatus } from "../services/tableService";
import { getReservations, updateReservationStatus, Reservation } from "../services/reservationService";
import { startPollTimer, getMetrics } from "../utils/performanceMonitor";
import { withOptimisticUpdate } from "../utils/optimisticUpdate";
import { useWebSocket, WS_FALLBACK_TO_POLLING } from "../hooks/useWebSocket";
import { WebSocketEventType, TableStatusChangedPayload } from "../types/websocket.types";
import ConnectionStatus from "../components/Common/ConnectionStatus";

type Props = {
  viewMode: "grid" | "list";
  setViewMode: (v: "grid" | "list") => void;
};

const TakeOrderContent = ({ viewMode, setViewMode }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentBranchId } = useBranch();
  const [openOrderPanel, setOpenOrderPanel] = useState<boolean>(false);
  const [floors, setFloors] = useState<FloorWithTables[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Selected table for order details panel
  const [selectedTable, setSelectedTable] = useState<{
    orderId: string;
    tableId: string;
    tableName: string;
    customerId?: string;
  } | null>(null);

  const [wsFallbackActive, setWsFallbackActive] = useState(false);

  // Track previous table statuses to detect changes
  const previousTablesRef = useRef<Map<string, string>>(new Map());

  // Track tables with recently changed status for animation
  const [recentlyChangedTables, setRecentlyChangedTables] = useState<Set<string>>(new Set());

  // Use branchId from BranchContext
  const branchId = currentBranchId || undefined;

  // Reservation state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);
  const [markingArrived, setMarkingArrived] = useState<string | null>(null);

  // Table filter state
  const [tableSearch, setTableSearch] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Build a map of tableId -> upcoming reservations for quick lookup
  const tableReservationMap = useRef<Map<string, Reservation[]>>(new Map());

  // Update the reservation map whenever reservations change
  useEffect(() => {
    const map = new Map<string, Reservation[]>();
    const now = new Date();
    reservations.forEach((res) => {
      if (!res.tableId) return;
      // Only include upcoming or currently active reservations (not past ones)
      const resDate = new Date(res.date);
      const [endH, endM] = res.endTime.split(':').map(Number);
      const resEnd = new Date(resDate.getFullYear(), resDate.getMonth(), resDate.getDate(), endH, endM);
      if (resEnd > now) {
        const existing = map.get(res.tableId) || [];
        existing.push(res);
        map.set(res.tableId, existing);
      }
    });
    tableReservationMap.current = map;
  }, [reservations]);

  // Fetch reservations for today
  const fetchReservations = useCallback(async () => {
    if (!branchId) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await getReservations({
        branchId,
        date: today,
        status: 'Confirmed',
      });
      if (response.success && response.data) {
        setReservations(response.data);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  }, [branchId]);

  // Auto-expire reservations whose endTime has passed (no-show → mark as available)
  useEffect(() => {
    const checkExpired = () => {
      const now = new Date();
      const today = new Date().toISOString().split('T')[0];
      setReservations((prev) =>
        prev.filter((res) => {
          const resDateStr = res.date.split('T')[0];
          if (resDateStr !== today) return true;
          const [endH, endM] = res.endTime.split(':').map(Number);
          const resEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM);
          return resEnd > now; // Keep only non-expired reservations
        })
      );
    };
    const interval = setInterval(checkExpired, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Check if a reservation time has arrived (within its time window)
  const isReservationActive = (res: Reservation): boolean => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const resDateStr = res.date.split('T')[0];
    if (resDateStr !== today) return false;
    const [startH, startM] = res.startTime.split(':').map(Number);
    const [endH, endM] = res.endTime.split(':').map(Number);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startH, startM);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM);
    return now >= start && now < end;
  };

  // Check if table should be prevented from assignment due to upcoming reservation
  const isTableReservedForUpcoming = (tableId: string): Reservation | null => {
    const tableRes = tableReservationMap.current.get(tableId);
    if (!tableRes || tableRes.length === 0) return null;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    for (const res of tableRes) {
      const resDateStr = res.date.split('T')[0];
      if (resDateStr !== today) continue;
      const [startH, startM] = res.startTime.split(':').map(Number);
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startH, startM);
      // Prevent assignment if reservation starts within 30 minutes or is currently active
      const thirtyMinsBefore = new Date(start.getTime() - 30 * 60000);
      const [endH, endM] = res.endTime.split(':').map(Number);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM);
      if (now >= thirtyMinsBefore && now < end) {
        return res;
      }
    }
    return null;
  };

  // Get the next reservation for a table
  const getNextReservation = (tableId: string): Reservation | null => {
    const tableRes = tableReservationMap.current.get(tableId);
    if (!tableRes || tableRes.length === 0) return null;
    // Sort by startTime and return the earliest
    const sorted = [...tableRes].sort((a, b) => a.startTime.localeCompare(b.startTime));
    return sorted[0];
  };

  // Handle "Mark Arrived" - changes table status to occupied and completes reservation
  const handleMarkArrived = async (reservation: Reservation, floorId: string, floorName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (markingArrived) return;
    setMarkingArrived(reservation.id);
    try {
      // Update reservation status to Completed
      await updateReservationStatus(reservation.id, { status: 'Completed' });
      // Update table status to occupied
      if (reservation.tableId) {
        await updateTableStatus(reservation.tableId, 'occupied');
      }
      // Remove this reservation from local state
      setReservations((prev) => prev.filter((r) => r.id !== reservation.id));
      showSuccessToast(`Reservation for ${reservation.customerName} marked as arrived`);
      // Navigate to take order page
      navigate('/pos/takeorder', {
        state: {
          tableId: reservation.tableId,
          tableName: reservation.table?.label || reservation.tableId,
          floorId,
          floorName,
          guestCount: reservation.guestCount,
        },
      });
    } catch (err) {
      console.error('Failed to mark reservation as arrived:', err);
      showErrorToast('Failed to mark reservation as arrived');
    } finally {
      setMarkingArrived(null);
    }
  };

  const fetchTableStatus = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    // Check if branchId is available
    if (!branchId) {
      setError("Branch not assigned. Please contact your administrator.");
      if (!silent) {
        setLoading(false);
      }
      return;
    }

    const endTimer = startPollTimer('TableView /pos/tables');

    try {
      const response = await getTableStatusOverview(branchId);

      if (response.success && response.data) {
        setFloors(response.data.floors);
        setLastUpdated(new Date());

        // Detect status changes and notify
        if (silent && response.data.floors) {
          const currentTables = new Map<string, string>();
          const changedTableIds = new Set<string>();

          // Build current table status map
          response.data.floors.forEach((floor) => {
            floor.tables.forEach((table) => {
              currentTables.set(table.id, table.currentStatus);
            });
          });

          // Check for status changes
          currentTables.forEach((currentStatus, tableId) => {
            const previousStatus = previousTablesRef.current.get(tableId);

            // Detect any status change
            if (previousStatus && previousStatus !== currentStatus) {
              changedTableIds.add(tableId);

              // Notify when table becomes available (was occupied/reserved, now available)
              if (currentStatus === "available") {
                // Find table name for notification
                let tableName = tableId;
                if (response.data) {
                  response.data.floors.forEach((floor) => {
                    const table = floor.tables.find(t => t.id === tableId);
                    if (table) {
                      tableName = table.name;
                    }
                  });
                }

                showSuccessToast(`Table ${tableName} is now available!`);
              }
            }
          });

          // Update recently changed tables for animation
          if (changedTableIds.size > 0) {
            setRecentlyChangedTables(changedTableIds);

            // Remove highlight after 3 seconds
            setTimeout(() => {
              setRecentlyChangedTables(new Set());
            }, 3000);
          }

          // Update reference for next comparison
          previousTablesRef.current = currentTables;
        }
      } else {
        setError(response.error?.message || "Failed to load table status");
      }
      endTimer(true);
    } catch (err) {
      endTimer(false);
      console.error("Error fetching table status:", err);
      if (!silent) {
        setError("An error occurred while loading table status");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // WebSocket connection for real-time table updates
  const { status: wsStatus, retryCount: wsRetryCount, lastConnectedAt: wsLastConnected, subscribe } = useWebSocket();

  // Subscribe to TABLE_STATUS_CHANGED WebSocket events
  useEffect(() => {
    if (wsStatus !== 'connected') return;

    const unsubTableStatus = subscribe<TableStatusChangedPayload>(
      WebSocketEventType.TABLE_STATUS_CHANGED,
      () => {
        fetchTableStatus(true);
        fetchReservations();
      }
    );

    return () => {
      unsubTableStatus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsStatus, subscribe]);

  // Initial load
  useEffect(() => {
    fetchTableStatus();
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

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

  // Fallback polling when WebSocket is not connected or fallback is active (30s for fallback, 60s otherwise)
  useEffect(() => {
    if (wsStatus === 'connected' && !wsFallbackActive) return;

    const FALLBACK_INTERVAL = wsFallbackActive ? 30000 : 60000;
    const timer = setInterval(() => {
      fetchTableStatus(true);
      fetchReservations();
    }, FALLBACK_INTERVAL);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, wsStatus, wsFallbackActive]);

const handleBack = () => {
  const entryPath =
    sessionStorage.getItem("posEntry") ||
    sessionStorage.getItem("lastNonPOS") ||
    "/";

  sessionStorage.removeItem("posEntry");
  navigate(entryPath);
};

  const handleTableClick = async (table: TableStatus, floorId: string, floorName: string) => {
    if (table.currentStatus === 'occupied') {
      // Select occupied table to show its order in the right panel
      if (table.currentOrder) {
        setSelectedTable({
          orderId: table.currentOrder.id,
          tableId: table.id,
          tableName: table.name,
          customerId: table.currentOrder.customerName ? undefined : undefined,
        });
        // On mobile, open the panel drawer
        setOpenOrderPanel(true);
      } else {
        showWarningToast(`Table ${table.name} is occupied but has no active order`);
      }
      return;
    }

    // Check for upcoming reservations that block this table
    const blockingReservation = isTableReservedForUpcoming(table.id);
    if (blockingReservation) {
      const resTime = blockingReservation.startTime;
      const proceed = window.confirm(
        `Table ${table.name} has a reservation for ${blockingReservation.customerName} at ${resTime} (${blockingReservation.guestCount} guests). Do you want to start an order anyway?`
      );
      if (!proceed) return;
    }

    if (table.currentStatus === 'reserved' && !blockingReservation) {
      const proceed = window.confirm(
        `Table ${table.name} is currently reserved. Do you want to start an order anyway?`
      );
      if (!proceed) return;
    }

    // Save original state for rollback
    const originalFloors = floors;

    try {
      await withOptimisticUpdate({
        operation: () => updateTableStatus(table.id, 'occupied'),
        onOptimisticUpdate: () => {
          // Immediately update UI to show table as occupied
          setFloors(prev => prev.map(floor => ({
            ...floor,
            tables: floor.tables.map(t =>
              t.id === table.id ? { ...t, currentStatus: 'occupied' as const } : t
            ),
          })));
        },
        onRollback: () => {
          setFloors(originalFloors);
        },
        errorMessage: 'Failed to update table status. Reverting change.',
      });
    } catch {
      // withOptimisticUpdate already handled rollback and toast
      // Navigate anyway so user can still start the order
    }

    // Navigate to take order page with table info
    navigate('/pos/takeorder', {
      state: {
        tableId: table.id,
        tableName: table.name,
        floorId,
        floorName,
        guestCount: table.capacity,
      },
    });
  };

  // Compute filtered floors based on search, floor filter, and status filter
  const filteredFloors = useMemo(() => {
    let result = floors;

    // Filter by floor
    if (floorFilter) {
      result = result.filter((f) => f.floorId === floorFilter);
    }

    // Filter tables within each floor by search and status
    if (tableSearch || statusFilter) {
      result = result
        .map((floor) => ({
          ...floor,
          tables: floor.tables.filter((table) => {
            const matchesSearch =
              !tableSearch ||
              table.name.toLowerCase().includes(tableSearch.toLowerCase());
            const matchesStatus =
              !statusFilter || table.currentStatus === statusFilter;
            return matchesSearch && matchesStatus;
          }),
        }))
        .filter((floor) => floor.tables.length > 0);
    }

    return result;
  }, [floors, tableSearch, floorFilter, statusFilter]);

  // Build floor options for the filter dropdown
  const floorOptions = useMemo(
    () => floors.map((f) => ({ id: f.floorId, name: f.floorName })),
    [floors]
  );

  const handleClearFilters = useCallback(() => {
    setTableSearch("");
    setFloorFilter("");
    setStatusFilter("");
  }, []);

  return (
    <div className="min-h-screen bg-bb-bg p-3 sm:p-4 lg:p-6">
      <POSHeader />
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-[#655016] hover:opacity-80 transition text-lg"
            aria-label="Back"
          >
            ←
          </button>

          <h1 className="text-sm sm:text-base lg:text-lg font-medium text-[#655016]">
            Point Of Sale
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* WebSocket Connection Status Indicator */}
          <ConnectionStatus
            status={wsStatus}
            lastUpdateTime={wsLastConnected}
            retryCount={wsRetryCount}
          />

          {lastUpdated && (
            <span className="text-xs text-bb-textSoft">
              Last updated: {lastUpdated.toLocaleTimeString()}
              {process.env.NODE_ENV === 'development' && getMetrics('TableView /pos/tables') && (
                <span className={`ml-1 ${(getMetrics('TableView /pos/tables')?.lastLatency || 0) > 2000 ? 'text-red-500 font-semibold' : 'text-green-600'}`}>
                  ({getMetrics('TableView /pos/tables')?.lastLatency}ms)
                </span>
              )}
            </span>
          )}
          <button
            onClick={() => fetchTableStatus()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-bb-primary text-bb-text rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh table status"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Fallback Warning Banner */}
      {wsFallbackActive && (
        <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-300 rounded-md flex items-center gap-2 text-sm text-amber-800">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Live updates unavailable - using 30 second refresh</span>
        </div>
      )}

      <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[2.2fr_1fr]">
        <div>
          <DiscountSection
            viewMode={viewMode}
            setViewMode={setViewMode}
            floors={floorOptions}
            onSearchChange={setTableSearch}
            onFloorFilter={setFloorFilter}
            onStatusFilter={setStatusFilter}
            onClear={handleClearFilters}
            onRefresh={() => fetchTableStatus()}
          />
          <OnlineOrderQueue />

          {/* Loading State */}
          {loading && (
            <div className="rounded-xl bg-[#F5F2EC] p-8 mt-6 text-center">
              <div className="text-bb-textSoft">Loading table status...</div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-8 mt-6 text-center">
              <div className="text-red-600 font-medium mb-2">Error Loading Tables</div>
              <div className="text-red-500 text-sm">{error}</div>
            </div>
          )}

          {/* Table Areas - Show only if data loaded successfully */}
          {!loading && !error && filteredFloors.length > 0 && filteredFloors.map((floor) => (
            <div key={floor.floorId} className="rounded-xl bg-[#f7f3eb] p-4 sm:p-6 mt-6 space-y-4 border border-[#e5dcc7]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{floor.floorName}</h2>
                <span className="text-sm text-bb-textSoft">
                  {floor.tables.length} table{floor.tables.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-4">
                {floor.tables.map((table) => {
                  const isRecentlyChanged = recentlyChangedTables.has(table.id);
                  const nextReservation = getNextReservation(table.id);
                  const hasReservation = !!nextReservation;
                  const reservationIsActive = nextReservation ? isReservationActive(nextReservation) : false;
                  const statusColors = {
                    available: "bg-[#d9f1bf] text-[#3e6c1f] border-[#c6e0a9]",
                    occupied: "bg-[#d8e8ff] text-[#1f5fbe] border-[#bcd6ff]",
                    reserved: "bg-[#f9d4cd] text-[#b23b34] border-[#eeb8af]",
                  } as const;
                  const bubbleColor =
                    table.currentStatus === "available"
                      ? statusColors.available
                      : table.currentStatus === "occupied"
                      ? statusColors.occupied
                      : statusColors.reserved;
                  return (
                    <div
                      key={table.id}
                      onClick={() => handleTableClick(table, floor.floorId, floor.floorName)}
                      onMouseEnter={() => hasReservation ? setHoveredTableId(table.id) : undefined}
                      onMouseLeave={() => setHoveredTableId(null)}
                      className={`relative w-[120px] h-[96px] bg-white border border-[#d7c5ab] rounded-xl shadow-sm cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md ${
                        isRecentlyChanged ? 'ring-2 ring-bb-primary' : ''
                      } ${selectedTable?.tableId === table.id ? 'ring-2 ring-bb-primary bg-yellow-50' : ''}`}
                    >
                      {/* Seats top */}
                      <div className="absolute top-1 left-3 right-3 flex justify-between">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <span key={i} className="w-6 h-2 rounded-full bg-[#e7d6c0]" />
                        ))}
                      </div>
                      {/* Seats bottom */}
                      <div className="absolute bottom-1 left-3 right-3 flex justify-between">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <span key={i} className="w-6 h-2 rounded-full bg-[#e7d6c0]" />
                        ))}
                      </div>
                      {/* Seats left/right */}
                      <div className="absolute inset-y-3 left-1 flex flex-col justify-between">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <span key={i} className="w-2 h-6 rounded-full bg-[#e7d6c0]" />
                        ))}
                      </div>
                      <div className="absolute inset-y-3 right-1 flex flex-col justify-between">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <span key={i} className="w-2 h-6 rounded-full bg-[#e7d6c0]" />
                        ))}
                      </div>

                      {/* Center circle */}
                      <div className={`absolute inset-0 m-auto w-16 h-16 rounded-full border ${bubbleColor} flex items-center justify-center font-semibold`}>
                        {table.name}
                      </div>

                      {/* Reserved Badge */}
                      {hasReservation && (
                        <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                          Reserved
                        </div>
                      )}

                      {/* Mark Arrived button - show when reservation time window is active */}
                      {nextReservation && reservationIsActive && (
                        <button
                          onClick={(e) => handleMarkArrived(nextReservation, floor.floorId, floor.floorName, e)}
                          disabled={markingArrived === nextReservation.id}
                          className="mt-2 w-full text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {markingArrived === nextReservation.id ? 'Marking...' : 'Mark Arrived'}
                        </button>
                      )}

                      {/* Reservation details tooltip on hover */}
                      {hasReservation && hoveredTableId === table.id && nextReservation && (
                        <div className="absolute z-20 left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg pointer-events-none">
                          <div className="font-semibold mb-1">{nextReservation.customerName}</div>
                          <div className="flex justify-between">
                            <span>Time:</span>
                            <span>{nextReservation.startTime} - {nextReservation.endTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Guests:</span>
                            <span>{nextReservation.guestCount}</span>
                          </div>
                          {nextReservation.customerPhone && (
                            <div className="flex justify-between">
                              <span>Phone:</span>
                              <span>{nextReservation.customerPhone}</span>
                            </div>
                          )}
                          {reservationIsActive && (
                            <div className="mt-1 text-green-300 font-medium">Currently active</div>
                          )}
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Empty State - Filters returned no results */}
          {!loading && !error && floors.length > 0 && filteredFloors.length === 0 && (
            <div className="rounded-xl bg-[#F5F2EC] p-8 mt-6 text-center">
              <div className="text-bb-textSoft">No tables match your filters.</div>
              <button
                onClick={handleClearFilters}
                className="mt-3 px-4 py-2 bg-bb-primary text-bb-text font-medium rounded-lg hover:opacity-90 transition text-sm"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Empty State - No floors/tables configured */}
          {!loading && !error && floors.length === 0 && (
            <div className="rounded-xl bg-[#F5F2EC] p-8 mt-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <svg className="w-16 h-16 text-bb-textSoft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
                <h3 className="text-lg font-semibold text-bb-text">No Tables Configured</h3>
                <p className="text-sm text-bb-textSoft max-w-md">
                  Tables and floors haven't been set up for this branch yet. Configure your restaurant layout to start managing tables.
                </p>
                <button
                  onClick={() => navigate('/business-settings/branches')}
                  className="mt-2 px-4 py-2 bg-bb-primary text-bb-text font-medium rounded-lg hover:opacity-90 transition"
                >
                  Configure Tables
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hidden xl:block overflow-hidden min-w-0">
          <OrderDetailsCard
            orderId={selectedTable?.orderId}
            tableId={selectedTable?.tableId}
            tableName={selectedTable?.tableName}
            customerId={selectedTable?.customerId}
          />
        </div>

        <button
          onClick={() => setOpenOrderPanel(true)}
          className="
          fixed right-0 top-1/2 -translate-y-1/2 z-40 xl:hidden
          h-24 w-8 bg-gray-700 text-white rounded-l-full
        "
        >
          &lt;
        </button>

        {openOrderPanel && (
          <div className="fixed inset-0 z-50 xl:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpenOrderPanel(false)}
            />
            <div className="absolute right-0 top-0 h-full w-[90%] max-w-sm bg-white animate-slide-in">
              <OrderDetailsCard
                orderId={selectedTable?.orderId}
                tableId={selectedTable?.tableId}
                tableName={selectedTable?.tableName}
                customerId={selectedTable?.customerId}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TakeOrderContent;
