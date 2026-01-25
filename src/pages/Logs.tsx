import { supabase } from "@/integrations/supabase/client";
import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import {
  Copy,
  Calendar,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
} from "lucide-react";

interface Transaction {
  id: string;
  user_id: string;
  user_name?: string;
  event_id: string;
  event_title?: string;
  type:
    | "credit_grant"
    | "credit_revoke"
    | "join_event"
    | "refund_event"
    | "registration_toggle"
    | "subscription_payment"
    | "subscription_cancelled"
    | "subscription_failed"
    | "subscription";
  amount: number;
  metadata: Record<string, unknown>;
  created_at: string;
  target_name?: string; // from target user profile join
}

const Logs: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedMetadataId, setExpandedMetadataId] = useState<string | null>(
    null,
  );

  const transactionTypes: Transaction["type"][] = [
    "credit_grant",
    "credit_revoke",
    "join_event",
    "refund_event",
    "registration_toggle",
    "subscription_payment",
    "subscription_cancelled",
    "subscription_failed",
    "subscription",
  ];

  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select(
        `
    id,
    user_id,
    event_id,
    type,
    amount,
    metadata,
    created_at,
    user:profiles!transactions_user_id_fkey(name),
    author_user:profiles!transactions_author_user_id_fkey(name),
    events(title)
  `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      // Failed to load transactions
      toast.error(error.message);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted: Transaction[] = (data ?? []).map((tx: any) => ({
        id: tx.id,
        user_id: tx.user_id,
        user_name: tx.user?.name ?? "Unknown",
        event_id: tx.event_id,
        event_title: tx.events?.title ?? "No event",
        type: tx.type,
        amount: tx.amount,
        metadata: tx.metadata ?? {},
        created_at: tx.created_at,
        target_name: tx.author_user?.name ?? "N/A",
      }));

      setTransactions(formatted);
    }
    setLoading(false);
  };

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      toast(`Transaction ID ${id} copied`);
    });
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // Filter transactions based on search term and selected types
  const filteredTransactions = useMemo(() => {
    let result = transactions;

    // Apply type filter
    if (selectedTypes.length > 0) {
      result = result.filter((t) => selectedTypes.includes(t.type));
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.user_name?.toLowerCase().includes(term) ||
          t.target_name?.toLowerCase().includes(term) ||
          t.event_title?.toLowerCase().includes(term),
      );
    }

    return result;
  }, [transactions, searchTerm, selectedTypes]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    endIndex,
  );

  // Reset to page 1 when search term changes
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSearchTerm("");
    setCurrentPage(1);
  };

  if (loading)
    return (
      <main className="flex-1 bg-background overflow-auto sm:ml-[96px]">
        <section className="container mx-auto px-6 pt-12">
          <p className="text-center text-muted-foreground">
            Loading event log...
          </p>
        </section>
      </main>
    );

  const getTypeColor = (type: string) => {
    switch (type) {
      case "credit_grant":
        return "bg-green-50 text-green-700 border-green-200";
      case "credit_revoke":
        return "bg-red-50 text-red-700 border-red-200";
      case "join_event":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "refund_event":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "registration_toggle":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "subscription_payment":
        return "bg-green-50 text-green-700 border-green-200";
      case "subscription_cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      case "subscription_failed":
        return "bg-red-50 text-red-700 border-red-200";
      case "subscription":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getTypeLabel = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <main className="flex-1 bg-background overflow-auto sm:ml-[96px]">
      <section className="container mx-auto px-6 pt-12 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Event Log</h1>
          <p className="text-muted-foreground">
            View all transaction history and activities
          </p>
        </div>

        {/* Search Bar and Filter Toggle */}
        <div className="mb-6 flex gap-2 items-center">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-4 py-2">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user name, action by, or event..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 outline-none text-sm bg-transparent placeholder-gray-400"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-foreground whitespace-nowrap"
          >
            <Filter className="h-4 w-4" />
            Filters
            {selectedTypes.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                {selectedTypes.length}
              </span>
            )}
          </button>
        </div>

        {/* Active Filters Display */}
        {selectedTypes.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {selectedTypes.map((type) => (
              <div
                key={type}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(type)}`}
              >
                {getTypeLabel(type)}
                <button
                  onClick={() => toggleTypeFilter(type)}
                  className="ml-1 hover:opacity-70 transition-opacity"
                  aria-label={`Remove filter: ${type}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              onClick={clearFilters}
              className="px-3 py-1 rounded-full text-xs font-semibold text-gray-600 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-sm mb-3 text-foreground">
              Filter by Transaction Type
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {transactionTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleTypeFilter(type)}
                    className="rounded border-gray-300 text-blue-600 cursor-pointer"
                  />
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded border ${getTypeColor(type)}`}
                  >
                    {getTypeLabel(type)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {paginatedTransactions.length === 0 &&
        filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : paginatedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">
              No transactions match your search
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {paginatedTransactions.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* User Section */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        User
                      </p>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <p className="font-medium text-foreground">
                          {t.user_name}
                        </p>
                      </div>
                    </div>

                    {/* Event Section */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Event
                      </p>
                      <p className="font-medium text-foreground truncate">
                        {t.event_title}
                      </p>
                    </div>

                    {/* Type & Amount Section */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Type
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(
                            t.type,
                          )}`}
                        >
                          {getTypeLabel(t.type)}
                        </span>
                        {[
                          "credit_grant",
                          "credit_revoke",
                          "join_event",
                          "refund_event",
                        ].includes(t.type) && (
                          <span className="font-semibold text-lg text-foreground">
                            {t.amount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(t.created_at).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      {typeof t.metadata === "object" &&
                        Object.keys(t.metadata).length > 0 && (
                          <button
                            onClick={() =>
                              setExpandedMetadataId(
                                expandedMetadataId === t.id ? null : t.id,
                              )
                            }
                            className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors duration-150 text-sm font-medium"
                            title="View metadata"
                          >
                            Metadata
                          </button>
                        )}
                      <button
                        onClick={() => copyToClipboard(t.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors duration-150 text-sm font-medium"
                        title={`Copy ID: ${t.id}`}
                      >
                        <Copy className="h-4 w-4" />
                        <span className="hidden sm:inline">Copy ID</span>
                      </button>
                    </div>
                  </div>

                  {/* Metadata Accordion */}
                  {expandedMetadataId === t.id &&
                    typeof t.metadata === "object" &&
                    Object.keys(t.metadata).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="bg-gray-900 rounded-lg overflow-hidden">
                          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
                            <span className="text-xs font-mono text-gray-400">
                              metadata.json
                            </span>
                            <button
                              onClick={() => setExpandedMetadataId(null)}
                              className="text-gray-400 hover:text-gray-200 transition-colors"
                              aria-label="Close metadata"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <pre className="px-4 py-3 overflow-x-auto max-h-96">
                            <code className="text-gray-100 font-mono text-xs leading-relaxed">
                              {JSON.stringify(t.metadata, null, 2)}
                            </code>
                          </pre>
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="pageSize"
                  className="text-sm font-medium text-foreground"
                >
                  Records per page:
                </label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-200 rounded-md text-sm bg-white hover:border-gray-300 cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredTransactions.length)} of{" "}
                {filteredTransactions.length} transactions
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm font-medium">
                    Previous
                  </span>
                </button>

                <div className="text-sm font-medium text-foreground">
                  Page {currentPage} of {Math.max(1, totalPages)}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <span className="hidden sm:inline text-sm font-medium">
                    Next
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default Logs;
