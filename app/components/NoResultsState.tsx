import { EmptyStateAnimation } from "./Animations";

interface NoResultsStateProps {
  searchTerm: string;
}

export function NoResultsState({ searchTerm }: NoResultsStateProps) {
  return (
    <EmptyStateAnimation
      heading="No Results Found"
      description={`No products match ${searchTerm ? "your search" : "the selected filters"}`}
      svg={
        <svg
          width="96"
          height="96"
          viewBox="0 0 96 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="16" y="20" width="64" height="56" rx="8" fill="#E6FFFA" />
          <rect x="24" y="28" width="48" height="8" rx="2" fill="#38B2AC" />
          <rect x="24" y="40" width="32" height="6" rx="2" fill="#CBD5E0" />
          <rect x="24" y="50" width="40" height="6" rx="2" fill="#CBD5E0" />
          <rect x="24" y="60" width="28" height="6" rx="2" fill="#CBD5E0" />
          <path
            d="M60 50C60 55.5228 55.5228 60 50 60C44.4772 60 40 55.5228 40 50C40 44.4772 44.4772 40 50 40C55.5228 40 60 44.4772 60 50Z"
            stroke="#F6AD55"
            strokeWidth="2"
          />
          <path
            d="M57 57L64 64"
            stroke="#F6AD55"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      }
    />
  );
}
