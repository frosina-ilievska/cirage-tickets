import { formatDistanceToNow } from "date-fns";

type Activity = {
  id: string;
  action: string;
  createdAt: string;
  user: { id: string; name: string };
};

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-gray-400 py-2">No activity yet.</p>;
  }

  return (
    <div className="flow-root">
      <ul className="-mb-6">
        {activities.map((activity, i) => (
          <li key={activity.id}>
            <div className="relative pb-6">
              {i < activities.length - 1 && (
                <span className="absolute left-3 top-3 -ml-px h-full w-0.5 bg-gray-100" />
              )}
              <div className="relative flex gap-3 items-start">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                  {activity.user.name[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{activity.user.name}</span>{" "}
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
