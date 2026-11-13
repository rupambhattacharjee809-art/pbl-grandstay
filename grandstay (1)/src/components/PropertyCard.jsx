import React, { useState } from 'react';
import { Heart, Star } from 'lucide-react';
import { formatINR, resolveMediaUrl } from '../utils/propertyImages.js';

export default function PropertyCard({
  property,
  isSaved,
  onToggleSave,
  onSelectProperty,
  onQuickBook,
}) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = resolveMediaUrl(property.image);

  return (
    <article className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
        {!imgError ? (
          <img
            src={imgSrc}
            alt={property.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            onClick={() => onSelectProperty(property)}
            className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div
            onClick={() => onSelectProperty(property)}
            className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500 text-xs px-4 text-center cursor-pointer"
          >
            <span className="font-medium text-slate-700">{property.name}</span>
            <span className="mt-1">{property.destination}</span>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(property._id);
          }}
          aria-label={isSaved ? `Remove ${property.name} from saved stays` : `Save ${property.name}`}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 text-[#0c1a2e] flex items-center justify-center shadow-sm hover:bg-white transition-colors cursor-pointer"
        >
          <Heart
            size={16}
            className={isSaved ? 'fill-[#dc2626] text-[#dc2626]' : 'text-slate-700'}
          />
        </button>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
            <span className="truncate">
              {property.destination} · {property.propertyType}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-[#0c1a2e] tabular-nums shrink-0">
              <Star size={12} className="fill-[#c59b27] text-[#c59b27]" />
              {property.rating?.toFixed(1)}
              <span className="font-normal text-slate-500">({property.reviewCount})</span>
            </span>
          </div>

          <h3
            onClick={() => onSelectProperty(property)}
            className="mt-1.5 font-display text-lg font-semibold text-[#0c1a2e] leading-snug cursor-pointer hover:text-[#1d3557]"
          >
            {property.name}
          </h3>

          <p className="mt-1 text-xs text-slate-500 truncate">{property.location}</p>

          <p className="mt-2.5 text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {property.description}
          </p>

          <p className="mt-3 text-xs text-slate-500 truncate">
            {property.amenities?.slice(0, 3).join(' · ')}
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-lg font-semibold text-[#0c1a2e] tabular-nums">
              {formatINR(property.pricePerNight)}
            </span>
            <span className="text-xs text-slate-500"> / night</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onSelectProperty(property)}
              className="px-3 py-2 text-xs font-semibold text-[#0c1a2e] border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => onQuickBook(property)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0c1a2e] hover:bg-[#132742] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Reserve
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
