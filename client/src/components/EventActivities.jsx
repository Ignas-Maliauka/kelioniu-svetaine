import React from "react";
import { Link } from "react-router-dom";

export default function EventActivities({ activities, isOrganiser, deleteActivity, id }) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-medium">Activities</h2>
        {isOrganiser && (
          <div className="flex gap-2">
            <Link
              to={`/events/${id}/activities/new`}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Create Activity
            </Link>
          </div>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="p-3 border rounded bg-white">No activities.</div>
      ) : (
        <ul className="space-y-2">
          {activities.map((a) => (
            <li key={a._id} className="p-3 border rounded bg-white flex justify-between items-start">
              <div>
                <div className="font-medium">{a.name}</div>
                {a.description && <div className="text-sm text-gray-600">{a.description}</div>}
                <div className="text-sm text-gray-500 mt-1">
                  {a.startTime ? new Date(a.startTime).toLocaleString() : ""} {a.endTime ? ` • ${new Date(a.endTime).toLocaleString()}` : ""}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {isOrganiser && (
                  <>
                    <Link
                      to={`/events/${id}/activities/${a._id}/edit`}
                      className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteActivity(a._id)}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </>
                )}
                <p>Last updated by: {a.updatedBy?.name || '—'}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
