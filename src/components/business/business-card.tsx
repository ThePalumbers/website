import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatStars } from "@/lib/utils";

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
  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">
            <Link href={`/business/${business.id}`} className="hover:underline">
              {business.name}
            </Link>
          </h3>
          <p className="text-sm text-[#645f56]">
            {business.city}, {business.state}
          </p>
          <p className="mt-1 text-sm">{formatStars(business.avgRating)} ({business.ratingsCount})</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {business.categories.slice(0, 3).map((name) => (
          <Badge key={name}>{name}</Badge>
        ))}
        {business.tags.slice(0, 2).map((name) => (
          <Badge key={name} className="bg-[#d6ecee] text-[#1f5d63]">
            {name}
          </Badge>
        ))}
      </div>
    </Card>
  );
}
