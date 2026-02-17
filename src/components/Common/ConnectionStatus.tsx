import React, { useState } from 'react';
import { ConnectionStatus as ConnectionStatusType } from '../../hooks/useWebSocket';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  lastUpdateTime?: Date | null;
  retryCount?: number;
  className?: string;
}

const statusConfig: Record<ConnectionStatusType, {
  dotColor: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  label: string;
  animate: boolean;
}> = {
  connected: {
    dotColor: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    label: 'Live',
    animate: false,
  },
  connecting: {
    dotColor: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
    label: 'Connecting...',
    animate: true,
  },
  disconnected: {
    dotColor: 'bg-gray-400',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-500',
    borderColor: 'border-gray-300',
    label: 'Offline - Attempting to reconnect',
    animate: false,
  },
  error: {
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    label: 'Connection Failed - Using Manual Refresh',
    animate: false,
  },
};

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  lastUpdateTime,
  retryCount = 0,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = statusConfig[status];

  return (
    <div
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        className={`w-2 h-2 rounded-full ${config.dotColor} ${config.animate ? 'animate-pulse' : ''}`}
      />
      <span>{config.label}</span>

      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-52 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 pointer-events-none">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="font-medium capitalize">{status}</span>
            </div>
            {lastUpdateTime && (
              <div className="flex justify-between">
                <span className="text-gray-400">Last update:</span>
                <span>{lastUpdateTime.toLocaleTimeString()}</span>
              </div>
            )}
            {(status === 'disconnected' || status === 'error') && retryCount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Retry count:</span>
                <span>{retryCount}/5</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
