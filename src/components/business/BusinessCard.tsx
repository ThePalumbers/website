import Link from "next/link";
import { Flame, MapPin, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  business: {
    id: string;
    name: string;
    city: string;
    state: string;
    avgRating: number | null;
    ratingsCount: number;
    categories: string[];
    tags: string[];
  };
};

export function BusinessCard({ business }: Props) {
  const hot = (business.avgRating ?? 0) >= 4.5 && business.ratingsCount >= 2;

  return (
    <Card className="p-4 transition-colors hover:bg-accent/40 hover:border-foreground/10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-medium tracking-tight">
            <Link href={`/business/${business.id}`} className="hover:text-brand">
              {business.name}
            </Link>
          </h3>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {business.city}, {business.state}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hot ? (
            <Badge className="border-important/30 bg-important/10 text-important">
              <Flame className="mr-1 h-3 w-3" />
              Hot
            </Badge>
          ) : null}
          <p className="flex items-center gap-1 text-sm text-amber-700 dark:text-amber-400">
            <Star className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
            {business.avgRating ? business.avgRating.toFixed(1) : "N/A"}
            <span className="text-xs text-amber-700/80 dark:text-amber-400/80">({business.ratingsCount})</span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {business.categories.slice(0, 3).map((name) => (
          <Badge key={name} className="border-entity/25 bg-entity/10 text-entity">
            {name}
          </Badge>
        ))}
        {business.tags.slice(0, 2).map((name) => (
          <Badge key={name} className="border-secondary-brand/25 bg-secondary-brand/10 text-brand/60">
            {name}
          </Badge>
        ))}
      </div>
    </Card>
  );
}
