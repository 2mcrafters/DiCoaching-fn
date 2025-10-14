import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Skeleton Loading Component
 * Displays animated skeleton placeholders while content loads
 */
export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  );
};

/**
 * Card Skeleton - For loading card-based content
 */
export const CardSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="border rounded-lg p-6 space-y-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * List Skeleton - For loading list items
 */
export const ListSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Table Skeleton - For loading table data
 */
export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4">
          {[...Array(cols)].map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Full Page Loading - For initial page loads
 */
export const PageLoading = ({ message = "Chargement..." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg font-medium text-muted-foreground">{message}</p>
      </motion.div>
    </div>
  );
};

/**
 * Inline Loading - For buttons and inline content
 */
export const InlineLoading = ({ size = "default", className }) => {
  const sizeClasses = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-6 w-6"
  };

  return (
    <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
  );
};

/**
 * Spinner with overlay - For full screen loading overlays
 */
export const LoadingOverlay = ({ message, transparent = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        transparent ? "bg-background/50" : "bg-background/80 backdrop-blur-sm"
      )}
    >
      <div className="bg-card p-8 rounded-lg shadow-lg text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        {message && (
          <p className="text-lg font-medium">{message}</p>
        )}
      </div>
    </motion.div>
  );
};

/**
 * Dots Loading Animation
 */
export const DotsLoading = () => {
  return (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-primary rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
};

/**
 * Progressive Loading Bar
 */
export const ProgressBar = ({ progress = 0, showPercentage = true }) => {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm">
        <span>Chargement</span>
        {showPercentage && <span>{Math.round(progress)}%</span>}
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <motion.div
          className="bg-primary h-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};

export default {
  Skeleton,
  CardSkeleton,
  ListSkeleton,
  TableSkeleton,
  PageLoading,
  InlineLoading,
  LoadingOverlay,
  DotsLoading,
  ProgressBar,
};
