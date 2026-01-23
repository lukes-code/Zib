import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile } from "@/types";

type UserListProps = {
  users: Profile[];
  loading: boolean;
  onAdjustCredits?: (userId: string, delta: number) => void;
  onToggleRegistered?: (userId: string, currentStatus: boolean) => void;
};

export const UserList = ({
  users,
  loading,
  onAdjustCredits,
  onToggleRegistered,
}: UserListProps) => {
  if (loading) {
    return (
      <>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-md w-full mb-2" />
        ))}
      </>
    );
  }

  if (users.length === 0) {
    return <p className="text-black">No users.</p>;
  }

  return (
    <>
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-gray-50"
        >
          <div>
            <p className="font-medium">{user.name || user.email}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm whitespace-nowrap">
              {user.credits} credits
            </span>
            {onAdjustCredits && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAdjustCredits(user.id, -1)}
                >
                  -1
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onAdjustCredits(user.id, 1)}
                >
                  +1
                </Button>
              </>
            )}
            {onToggleRegistered && (
              <Button
                size="sm"
                variant={user.registered ? "secondary" : "primary"}
                onClick={() => onToggleRegistered(user.id, user.registered)}
              >
                {user.registered ? "Unregister" : "Register"}
              </Button>
            )}
          </div>
        </div>
      ))}
    </>
  );
};
