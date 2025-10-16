import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  delay,
  description,
  onClick,
  active,
  badge,
}) => {
  const isInteractive = typeof onClick === "function";

  const handleKeyDown = (event) => {
    if (!isInteractive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick(event);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="h-full"
    >
      <Card
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className={`relative h-full flex flex-col bg-gradient-to-br ${color} text-white border-none shadow-lg transition-shadow duration-300 ${
          isInteractive
            ? "cursor-pointer hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/20"
            : ""
        } ${
          active
            ? "ring-2 ring-white/80 ring-offset-2 ring-offset-black/30"
            : ""
        }`}
      >
        {badge && badge > 0 && (
          <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform bg-red-500 rounded-full min-w-[1.5rem] shadow-lg z-10">
            {badge}
          </span>
        )}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-5 w-5 text-white/80" />
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-center">
          <div className="text-3xl font-bold">{value}</div>
          {description && (
            <p className="text-white/80 text-xs mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;
