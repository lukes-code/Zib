import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import React, { useEffect, useState } from "react";

interface Transaction {
  id: string;
  user_id: string;
  user_name?: string; // from profiles.name join
  event_id: string;
  event_title?: string; // from events.title join
  type: "credit_grant" | "credit_revoke" | "join_event" | "refund_event";
  amount: number;
  metadata: any; // object expected here
  created_at: string;
  target_name?: string; // from target user profile join
}

const Logs: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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
  `
      )
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Failed to load transactions",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const formatted = (data ?? []).map((tx) => ({
        ...tx,
        user_name: tx.user?.name ?? "Unknown",
        target_name: tx.author_user?.name ?? "N/A",
        event_title: tx.events?.title ?? "No event",
      }));

      setTransactions(formatted);
    }
    setLoading(false);
  };

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      toast({
        title: "Copied to clipboard",
        description: `Transaction ID ${id} copied`,
        variant: "default",
      });
    });
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  if (loading) return <p>Loading event log...</p>;

  return (
    <main className="relative bg-gray-50 flex-1 bg-background overflow-auto">
      <section className="relative z-10 container mx-auto px-6 pt-12 space-y-6">
        <h1 className="text-2xl font-bold mb-4">Event Log</h1>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-1 text-left">
                  Copy ID
                </th>
                <th className="border border-gray-300 px-3 py-1 text-left">
                  User
                </th>
                <th className="border border-gray-300 px-3 py-1 text-left">
                  Action by
                </th>
                <th className="border border-gray-300 px-3 py-1 text-left">
                  Event
                </th>
                <th className="border border-gray-300 px-3 py-1 text-left">
                  Type
                </th>
                <th className="border border-gray-300 px-3 py-1 text-right">
                  Amount
                </th>
                <th className="border border-gray-300 px-3 py-1 text-left">
                  Metadata
                </th>
                <th className="border border-gray-300 px-3 py-1 text-left">
                  Created at
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-1">
                    <button
                      onClick={() => copyToClipboard(t.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Copy ID
                    </button>
                  </td>
                  <td className="border border-gray-300 px-3 py-1">
                    {t.user_name}
                  </td>
                  <td className="border border-gray-300 px-3 py-1">
                    {t.target_name}
                  </td>
                  <td className="border border-gray-300 px-3 py-1">
                    {t.event_title}
                  </td>
                  <td className="border border-gray-300 px-3 py-1">{t.type}</td>
                  <td className="border border-gray-300 px-3 py-1 text-right">
                    {t.amount}
                  </td>
                  <td className="border border-gray-300 px-3 py-1 max-w-xs truncate">
                    {typeof t.metadata === "object"
                      ? JSON.stringify(t.metadata)
                      : String(t.metadata)}
                  </td>
                  <td className="border border-gray-300 px-3 py-1">
                    {new Date(t.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default Logs;
