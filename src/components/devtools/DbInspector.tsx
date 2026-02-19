"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type OverviewResponse = {
  counts: {
    users: number;
    businesses: number;
    feedbacks: number;
    friendships: number;
    reactions: number;
    photos: number;
    checkins: number;
  };
  topBusinesses: Array<{
    businessId: string;
    name: string;
    city: string;
    state: string;
    avgRating: number | null;
    feedbackCount: number;
  }>;
  latestFeedback: Array<{
    id: string;
    type: string;
    rating: number | null;
    timestamp: string;
    user: { id: string; name: string };
    business: { id: string; name: string };
  }>;
};

type ChecksResponse = {
  checks: Array<{ key: string; title: string; violations: number; pass: boolean }>;
};

type BusinessSearchResponse = {
  items: Array<{
    id: string;
    name: string;
    city: string;
    state: string;
    _count: { feedbacks: number; photos: number; checkins: number };
  }>;
  limit: number;
};

type BusinessLookupResponse = {
  id: string;
  name: string;
  city: string;
  state: string;
  street: string | null;
  postalCode: string | null;
  _count: { photos: number; checkins: number; feedbacks: number };
  businessCategories: Array<{ category: { id: string; name: string } }>;
  businessTags: Array<{ tag: { id: string; name: string } }>;
  feedbacks: Array<{
    id: string;
    type: string;
    rating: number | null;
    text: string | null;
    timestamp: string;
    user: { id: string; name: string };
  }>;
};

type UserLookupResponse = {
  user: { id: string; name: string; registrationDate: string };
  friendsCount: number;
  latestFeedback: Array<{
    id: string;
    type: string;
    rating: number | null;
    text: string | null;
    timestamp: string;
    business: { id: string; name: string; city: string; state: string };
  }>;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "same-origin" });
  const raw = await res.text();
  const data = raw ? JSON.parse(raw) : null;
  if (!res.ok) {
    const message = data?.error ?? `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export function DbInspector() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [checks, setChecks] = useState<ChecksResponse | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingChecks, setLoadingChecks] = useState(true);
  const [errorOverview, setErrorOverview] = useState<string | null>(null);
  const [errorChecks, setErrorChecks] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<BusinessSearchResponse | null>(null);

  const [businessId, setBusinessId] = useState("");
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [businessResult, setBusinessResult] = useState<BusinessLookupResponse | null>(null);

  const [userLookup, setUserLookup] = useState("");
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [userResult, setUserResult] = useState<UserLookupResponse | null>(null);

  const totalViolations = useMemo(() => checks?.checks.reduce((acc, c) => acc + c.violations, 0) ?? 0, [checks]);

  const loadOverview = async () => {
    setLoadingOverview(true);
    setErrorOverview(null);
    try {
      const data = await fetchJson<OverviewResponse>("/api/devtools/db/overview");
      setOverview(data);
    } catch (error) {
      setErrorOverview(error instanceof Error ? error.message : "Failed to load overview.");
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadChecks = async () => {
    setLoadingChecks(true);
    setErrorChecks(null);
    try {
      const data = await fetchJson<ChecksResponse>("/api/devtools/db/checks");
      setChecks(data);
    } catch (error) {
      setErrorChecks(error instanceof Error ? error.message : "Failed to load checks.");
    } finally {
      setLoadingChecks(false);
    }
  };

  useEffect(() => {
    loadOverview();
    loadChecks();
  }, []);

  const onSearchBusiness = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("query", searchQuery.trim());
      if (searchCity.trim()) params.set("city", searchCity.trim());
      params.set("limit", "20");

      const data = await fetchJson<BusinessSearchResponse>(`/api/devtools/db/search-business?${params.toString()}`);
      setSearchResult(data);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setSearchLoading(false);
    }
  };

  const onLookupBusiness = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!businessId.trim()) return;
    setBusinessLoading(true);
    setBusinessError(null);
    try {
      const data = await fetchJson<BusinessLookupResponse>(`/api/devtools/db/business/${encodeURIComponent(businessId.trim())}`);
      setBusinessResult(data);
    } catch (error) {
      setBusinessError(error instanceof Error ? error.message : "Lookup failed.");
      setBusinessResult(null);
    } finally {
      setBusinessLoading(false);
    }
  };

  const onLookupUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userLookup.trim()) return;
    setUserLoading(true);
    setUserError(null);
    try {
      const data = await fetchJson<UserLookupResponse>(`/api/devtools/db/user/${encodeURIComponent(userLookup.trim())}`);
      setUserResult(data);
    } catch (error) {
      setUserError(error instanceof Error ? error.message : "Lookup failed.");
      setUserResult(null);
    } finally {
      setUserLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">Overview</p>
          <Button size="sm" variant="outline" onClick={loadOverview} disabled={loadingOverview}>
            Refresh
          </Button>
        </div>

        {loadingOverview ? (
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 7 }).map((_, idx) => (
              <Skeleton key={idx} className="h-20" />
            ))}
          </div>
        ) : errorOverview ? (
          <p className="text-sm text-destructive">{errorOverview}</p>
        ) : overview ? (
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            {Object.entries(overview.counts).map(([key, value]) => (
              <Card key={key} className="border p-3">
                <p className="text-xs uppercase text-muted-foreground">{key}</p>
                <p className="mt-1 text-lg font-semibold">{value}</p>
              </Card>
            ))}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <p className="mb-3 text-sm font-medium">Top businesses by average rating</p>
          {loadingOverview ? (
            <Skeleton className="h-40" />
          ) : overview ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Avg rating</TableHead>
                  <TableHead>#Feedback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.topBusinesses.map((item) => (
                  <TableRow key={item.businessId}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.city}, {item.state}</TableCell>
                    <TableCell>{item.avgRating?.toFixed(2) ?? "N/A"}</TableCell>
                    <TableCell>{item.feedbackCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </Card>

        <Card className="p-4">
          <p className="mb-3 text-sm font-medium">Latest feedback (10)</p>
          {loadingOverview ? (
            <Skeleton className="h-40" />
          ) : overview ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.latestFeedback.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.user.name}</TableCell>
                    <TableCell>{item.business.name}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.rating ?? "-"}</TableCell>
                    <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </Card>
      </div>

      <Card className="space-y-4 p-4">
        <p className="text-sm font-medium">Search / Lookup</p>

        <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" onSubmit={onSearchBusiness}>
          <Input placeholder="Business name contains..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <Input placeholder="City contains..." value={searchCity} onChange={(e) => setSearchCity(e.target.value)} />
          <Button type="submit" disabled={searchLoading}>{searchLoading ? "Searching..." : "Search businesses"}</Button>
        </form>
        {searchError ? <p className="text-xs text-destructive">{searchError}</p> : null}
        {searchResult ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Feedbacks</TableHead>
                <TableHead>Photos</TableHead>
                <TableHead>Checkins</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResult.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.city}, {item.state}</TableCell>
                  <TableCell>{item._count.feedbacks}</TableCell>
                  <TableCell>{item._count.photos}</TableCell>
                  <TableCell>{item._count.checkins}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-md border p-3">
            <form className="flex gap-2" onSubmit={onLookupBusiness}>
              <Input placeholder="Lookup business by id" value={businessId} onChange={(e) => setBusinessId(e.target.value)} />
              <Button type="submit" variant="outline" disabled={businessLoading}>{businessLoading ? "Loading..." : "Lookup"}</Button>
            </form>
            {businessError ? <p className="text-xs text-destructive">{businessError}</p> : null}
            {businessResult ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium">{businessResult.name}</p>
                <p className="text-muted-foreground">{businessResult.city}, {businessResult.state}</p>
                <p className="text-xs text-muted-foreground">feedbacks: {businessResult._count.feedbacks} · photos: {businessResult._count.photos} · checkins: {businessResult._count.checkins}</p>
                <p className="text-xs text-muted-foreground">
                  categories: {businessResult.businessCategories.map((c) => c.category.name).join(", ") || "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  tags: {businessResult.businessTags.map((t) => t.tag.name).join(", ") || "-"}
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {businessResult.feedbacks.map((fb) => (
                      <TableRow key={fb.id}>
                        <TableCell>{fb.user.name}</TableCell>
                        <TableCell>{fb.type}</TableCell>
                        <TableCell>{fb.rating ?? "-"}</TableCell>
                        <TableCell>{new Date(fb.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <form className="flex gap-2" onSubmit={onLookupUser}>
              <Input placeholder="Lookup user by username/id" value={userLookup} onChange={(e) => setUserLookup(e.target.value)} />
              <Button type="submit" variant="outline" disabled={userLoading}>{userLoading ? "Loading..." : "Lookup"}</Button>
            </form>
            {userError ? <p className="text-xs text-destructive">{userError}</p> : null}
            {userResult ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium">{userResult.user.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{userResult.user.id}</p>
                <p className="text-xs text-muted-foreground">friends: {userResult.friendsCount} · joined: {new Date(userResult.user.registrationDate).toLocaleDateString()}</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userResult.latestFeedback.map((fb) => (
                      <TableRow key={fb.id}>
                        <TableCell>{fb.business.name}</TableCell>
                        <TableCell>{fb.type}</TableCell>
                        <TableCell>{fb.rating ?? "-"}</TableCell>
                        <TableCell>{new Date(fb.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Data integrity checks</p>
          <div className="flex items-center gap-2">
            <Badge className={totalViolations === 0 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"}>
              {totalViolations === 0 ? "PASS" : "FAIL"}
            </Badge>
            <Button size="sm" variant="outline" onClick={loadChecks} disabled={loadingChecks}>Refresh</Button>
          </div>
        </div>

        {loadingChecks ? (
          <Skeleton className="h-24" />
        ) : errorChecks ? (
          <p className="inline-flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{errorChecks}</p>
        ) : checks ? (
          <div className="space-y-2">
            {checks.checks.map((check) => (
              <div key={check.key} className="flex items-center justify-between rounded-md border p-2">
                <p className="text-sm">{check.title}</p>
                <div className="flex items-center gap-2">
                  <Badge className={check.pass ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"}>
                    {check.pass ? "PASS" : "FAIL"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">violations: {check.violations}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
