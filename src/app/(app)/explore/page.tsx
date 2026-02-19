import { Building2 } from "lucide-react";
import { listBusinesses } from "@/lib/services";
import { parsePageLimit } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BusinessCard } from "@/components/business/BusinessCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { SectionHeader } from "@/components/common/SectionHeader";

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function ExplorePage({ searchParams }: SearchProps) {
  const params = await searchParams;
  const pageRaw = getParam(params, "page") ?? "1";
  const limitRaw = getParam(params, "limit") ?? "12";
  const { page, limit } = parsePageLimit(pageRaw, limitRaw, 12);

  const items = await listBusinesses({
    query: getParam(params, "query"),
    city: getParam(params, "city"),
    category: getParam(params, "category"),
    tag: getParam(params, "tag"),
    openNow: getParam(params, "openNow") === "true",
    minRating: getParam(params, "minRating") ? Number(getParam(params, "minRating")) : undefined,
  });

  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);
  const totalPages = Math.max(1, Math.ceil(items.length / limit));

  const query = Object.fromEntries(
    Object.entries(params).flatMap(([k, v]) => (typeof v === "string" && k !== "page" && k !== "limit" ? [[k, v]] : [])),
  );

  return (
    <div className="space-y-6">
      <SectionHeader title="Explore" subtitle="Search and filter businesses" />

      <Card className="p-4">
        <form className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <Input name="query" defaultValue={getParam(params, "query") ?? ""} placeholder="Search" />
          <Input name="city" defaultValue={getParam(params, "city") ?? ""} placeholder="City" />
          <Input name="category" defaultValue={getParam(params, "category") ?? ""} placeholder="Category" />
          <Input name="tag" defaultValue={getParam(params, "tag") ?? ""} placeholder="Tag" />
          <Input name="minRating" defaultValue={getParam(params, "minRating") ?? ""} placeholder="Min rating" />
          <Button type="submit">Apply filters</Button>
        </form>
      </Card>

      <section className="space-y-3">
        {paged.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No businesses found"
            description="Try a broader query or remove some filters."
            ctaLabel="Reset filters"
            ctaHref="/explore"
          />
        ) : (
          paged.map((business) => <BusinessCard key={business.id} business={business} />)
        )}
      </section>

      <Pagination basePath="/explore" page={page} totalPages={totalPages} limit={limit} query={query} />
    </div>
  );
}
