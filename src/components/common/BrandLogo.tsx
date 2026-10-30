import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Golden Monogram H Icon */}
      <div className={`${iconSizes[size]} relative flex-shrink-0 rounded-xl overflow-hidden shadow-lg shadow-amber-950/40 border border-amber-500/30 bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 flex items-center justify-center`}>
        <img src="/logo.svg" alt="HILALPOS Logo" className="w-full h-full object-contain p-1" />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`${textSizes[size]} font-extrabold tracking-wider font-serif bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent`}>
            HILAL<span className="text-amber-400">POS</span>
          </span>
          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold tracking-widest">
            PRO
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] tracking-widest text-emerald-300/80 uppercase font-semibold">
            SATU SISTEM, SEMUA USAHA
          </span>
        )}
      </div>
    </div>
  );
};
