import React from 'react';

const Card = ({
  title,
  value,
  subtitle,
  icon,
  gradient = 'from-blue-600 to-indigo-600',
  className = '',
  warning,
}) => {
  return (
    <div className={`card bg-gradient-to-br ${gradient} text-white ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-90">{title}</p>
          <div className="mt-2 flex items-baseline">
            <h3 className="text-3xl font-bold">{value}</h3>
          </div>
          {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
          {warning && <p className="text-xs font-semibold text-red-100 mt-1">{warning}</p>}
        </div>
        {icon && <div className="text-4xl ml-4">{icon}</div>}
      </div>
    </div>
  );
};

export default Card;
