"use client";

import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  FileWarning,
  ShieldX,
  Timer,
  TimerOff,
  UserX,
  Users,
  Wallet,
  WifiOff,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  BlockchainErrorCategory,
  ParsedBlockchainError,
} from "@/lib/errors/blockchain-errors";
import { cn } from "@/lib/utils";

interface BlockchainErrorAlertProps {
  error: ParsedBlockchainError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showTechnicalDetails?: boolean;
  className?: string;
}

/**
 * Get the appropriate icon component for an error category
 */
function getErrorIcon(category: BlockchainErrorCategory) {
  const iconMap: Record<BlockchainErrorCategory, React.ReactNode> = {
    insufficient_balance: <Wallet className="h-5 w-5" />,
    bounty_not_active: <Clock className="h-5 w-5" />,
    bounty_insufficient_funds: <Banknote className="h-5 w-5" />,
    invalid_signatory: <UserX className="h-5 w-5" />,
    already_approved: <CheckCircle className="h-5 w-5" />,
    threshold_not_met: <Users className="h-5 w-5" />,
    timepoint_invalid: <Timer className="h-5 w-5" />,
    transaction_timeout: <TimerOff className="h-5 w-5" />,
    network_error: <WifiOff className="h-5 w-5" />,
    wasm_error: <AlertTriangle className="h-5 w-5" />,
    user_rejected: <XCircle className="h-5 w-5" />,
    call_data_mismatch: <FileWarning className="h-5 w-5" />,
    permission_denied: <ShieldX className="h-5 w-5" />,
    unknown: <AlertCircle className="h-5 w-5" />,
  };
  return iconMap[category];
}

/**
 * Get styling classes based on error severity
 */
function getSeverityStyles(severity: "error" | "warning" | "info") {
  const styles = {
    error: {
      container: "border-red-200 bg-red-50",
      icon: "text-red-600",
      title: "text-red-900",
      description: "text-red-800",
      actionBg: "bg-red-100",
      actionText: "text-red-700",
      button: "border-red-300 text-red-700 hover:bg-red-100",
    },
    warning: {
      container: "border-orange-200 bg-orange-50",
      icon: "text-orange-600",
      title: "text-orange-900",
      description: "text-orange-800",
      actionBg: "bg-orange-100",
      actionText: "text-orange-700",
      button: "border-orange-300 text-orange-700 hover:bg-orange-100",
    },
    info: {
      container: "border-blue-200 bg-blue-50",
      icon: "text-blue-600",
      title: "text-blue-900",
      description: "text-blue-800",
      actionBg: "bg-blue-100",
      actionText: "text-blue-700",
      button: "border-blue-300 text-blue-700 hover:bg-blue-100",
    },
  };
  return styles[severity];
}

/**
 * Blockchain Error Alert Component
 *
 * Displays detailed, user-friendly blockchain error information with:
 * - Clear error title and description
 * - Actionable steps for resolution
 * - Expandable technical details
 * - Relevant context information
 * - Optional retry and dismiss actions
 */
export function BlockchainErrorAlert({
  error,
  onRetry,
  onDismiss,
  showTechnicalDetails = true,
  className,
}: BlockchainErrorAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const styles = getSeverityStyles(error.severity);
  const icon = getErrorIcon(error.category);

  const handleCopyError = async () => {
    const errorText = `
Error: ${error.title}
Category: ${error.category}
Description: ${error.description}
Original Message: ${error.originalMessage}
Context: ${JSON.stringify(error.context, null, 2)}
    `.trim();

    await navigator.clipboard.writeText(errorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasContext = Object.keys(error.context).some(
    (key) => error.context[key as keyof typeof error.context] !== undefined,
  );

  return (
    <Card className={cn("overflow-hidden", styles.container, className)}>
      <div className="p-4">
        {/* Header with icon and title */}
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5 flex-shrink-0", styles.icon)}>{icon}</div>
          <div className="min-w-0 flex-1">
            <h3 className={cn("font-semibold", styles.title)}>{error.title}</h3>
            <p className={cn("mt-1 text-sm", styles.description)}>
              {error.description}
            </p>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={cn(
                "flex-shrink-0 rounded p-1 transition-colors hover:bg-black/5",
                styles.icon,
              )}
              aria-label="Dismiss error"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action items */}
        {error.actionItems.length > 0 && (
          <div className={cn("mt-4 rounded-md p-3", styles.actionBg)}>
            <p className={cn("mb-2 text-xs font-medium", styles.actionText)}>
              What you can do:
            </p>
            <ul className="space-y-1.5">
              {error.actionItems.map((action, index) => (
                <li
                  key={index}
                  className={cn(
                    "flex items-start gap-2 text-sm",
                    styles.actionText,
                  )}
                >
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-current" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Help link */}
        {error.helpLink && (
          <a
            href={error.helpLink}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-2 hover:underline",
              styles.actionText,
            )}
          >
            Learn more
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        {/* Expandable technical details */}
        {showTechnicalDetails && (hasContext || error.originalMessage) && (
          <div className="mt-4 border-t border-current/10 pt-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "flex w-full items-center justify-between text-xs font-medium",
                styles.actionText,
              )}
            >
              <span>Technical Details</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-3">
                {/* Context information */}
                {hasContext && (
                  <div className="rounded border border-current/10 bg-white/50 p-3">
                    <p className="mb-2 text-xs font-medium text-gray-600">
                      Context Information
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      {error.context.parentBountyId !== undefined && (
                        <>
                          <span className="text-gray-500">
                            Parent Bounty ID:
                          </span>
                          <span className="font-mono text-gray-700">
                            {error.context.parentBountyId}
                          </span>
                        </>
                      )}
                      {error.context.bountyStatus && (
                        <>
                          <span className="text-gray-500">Bounty Status:</span>
                          <span className="font-mono text-gray-700">
                            {error.context.bountyStatus}
                          </span>
                        </>
                      )}
                      {error.context.bountyValue && (
                        <>
                          <span className="text-gray-500">Bounty Value:</span>
                          <span className="font-mono text-gray-700">
                            {error.context.bountyValue} tokens
                          </span>
                        </>
                      )}
                      {error.context.payoutRequired && (
                        <>
                          <span className="text-gray-500">
                            Payout Required:
                          </span>
                          <span className="font-mono text-gray-700">
                            {error.context.payoutRequired} tokens
                          </span>
                        </>
                      )}
                      {error.context.network && (
                        <>
                          <span className="text-gray-500">Network:</span>
                          <span className="font-mono text-gray-700 uppercase">
                            {error.context.network}
                          </span>
                        </>
                      )}
                      {error.context.accountAddress && (
                        <>
                          <span className="text-gray-500">Account:</span>
                          <span className="truncate font-mono text-gray-700">
                            {error.context.accountAddress.slice(0, 8)}...
                            {error.context.accountAddress.slice(-6)}
                          </span>
                        </>
                      )}
                      {error.context.currentBalance && (
                        <>
                          <span className="text-gray-500">
                            Current Balance:
                          </span>
                          <span className="font-mono text-gray-700">
                            {error.context.currentBalance}
                          </span>
                        </>
                      )}
                      {error.context.requiredBalance && (
                        <>
                          <span className="text-gray-500">
                            Required Balance:
                          </span>
                          <span className="font-mono text-gray-700">
                            {error.context.requiredBalance}
                          </span>
                        </>
                      )}
                      {error.context.threshold !== undefined && (
                        <>
                          <span className="text-gray-500">Threshold:</span>
                          <span className="font-mono text-gray-700">
                            {error.context.threshold}
                          </span>
                        </>
                      )}
                      {error.context.currentApprovals !== undefined && (
                        <>
                          <span className="text-gray-500">
                            Current Approvals:
                          </span>
                          <span className="font-mono text-gray-700">
                            {error.context.currentApprovals}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Original error message */}
                {error.originalMessage && (
                  <div className="rounded border border-current/10 bg-white/50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-600">
                        Original Error
                      </p>
                      <button
                        onClick={handleCopyError}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="h-3 w-3" />
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-all rounded bg-gray-100 p-2 font-mono text-xs text-gray-700">
                      {error.originalMessage}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {(onRetry || onDismiss) && (
          <div className="mt-4 flex items-center gap-2">
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className={styles.button}
              >
                Try Again
              </Button>
            )}
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className={cn("text-gray-600 hover:text-gray-900")}
              >
                Dismiss
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Compact version for inline display (e.g., in toasts or small spaces)
 */
interface CompactBlockchainErrorProps {
  error: ParsedBlockchainError;
  className?: string;
}

export function CompactBlockchainError({
  error,
  className,
}: CompactBlockchainErrorProps) {
  const styles = getSeverityStyles(error.severity);
  const icon = getErrorIcon(error.category);

  return (
    <div className={cn("flex items-start gap-2", className)}>
      <div className={cn("mt-0.5 flex-shrink-0", styles.icon)}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", styles.title)}>{error.title}</p>
        <p className={cn("mt-0.5 text-xs", styles.description)}>
          {error.actionItems[0] || error.description}
        </p>
      </div>
    </div>
  );
}
