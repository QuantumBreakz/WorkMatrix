"use client";

import { useConnectionManager } from "@/hooks/use-connection-manager";
import { cn } from "@/lib/utils";
import { Loader2, Wifi, WifiOff, AlertCircle, RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusConfig = {
  connecting: {
    icon: Loader2,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    message: "Connecting to monitoring service...",
  },
  connected: {
    icon: Wifi,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    message: "Connected to monitoring service",
  },
  disconnected: {
    icon: WifiOff,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    message: "Disconnected from monitoring service",
  },
  reconnecting: {
    icon: AlertCircle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    message: "Reconnecting to monitoring service...",
  },
};

export function ConnectionStatusIndicator() {
  const { status, reconnect, disconnect } = useConnectionManager();
  const config = statusConfig[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-colors cursor-pointer hover:opacity-80",
                  config.bgColor
                )}
              >
                <config.icon
                  className={cn("w-4 h-4", config.color, {
                    "animate-spin": status === "connecting" || status === "reconnecting",
                  })}
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {status === "disconnected" && (
                <DropdownMenuItem onClick={reconnect}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reconnect
                </DropdownMenuItem>
              )}
              {status === "connected" && (
                <DropdownMenuItem onClick={disconnect}>
                  <WifiOff className="w-4 h-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ConnectionStatusBadge() {
  const { status, reconnect, disconnect, retryCount } = useConnectionManager();
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors",
          config.bgColor,
          config.color
        )}
      >
        <config.icon
          className={cn("w-4 h-4", {
            "animate-spin": status === "connecting" || status === "reconnecting",
          })}
        />
        <span>
          {status === "reconnecting"
            ? `${config.message} (${retryCount}/5)`
            : config.message}
        </span>
      </div>
      {status === "disconnected" && (
        <Button
          variant="outline"
          size="sm"
          onClick={reconnect}
          className="h-8"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reconnect
        </Button>
      )}
      {status === "connected" && (
        <Button
          variant="outline"
          size="sm"
          onClick={disconnect}
          className="h-8"
        >
          <WifiOff className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      )}
    </div>
  );
}

export function ConnectionStatusCard() {
  const { status, reconnect, disconnect, retryCount, lastError } = useConnectionManager();
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-colors",
        config.bgColor,
        "border-border"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <config.icon
            className={cn("w-5 h-5", config.color, {
              "animate-spin": status === "connecting" || status === "reconnecting",
            })}
          />
          <div>
            <h3 className="font-medium">Connection Status</h3>
            <p className={cn("text-sm", config.color)}>
              {status === "reconnecting"
                ? `${config.message} (${retryCount}/5)`
                : config.message}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === "disconnected" && (
            <Button
              variant="outline"
              size="sm"
              onClick={reconnect}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reconnect
            </Button>
          )}
          {status === "connected" && (
            <Button
              variant="outline"
              size="sm"
              onClick={disconnect}
            >
              <WifiOff className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          )}
        </div>
      </div>
      {lastError && (
        <p className="mt-2 text-sm text-red-500">
          Error: {lastError}
        </p>
      )}
    </div>
  );
} 