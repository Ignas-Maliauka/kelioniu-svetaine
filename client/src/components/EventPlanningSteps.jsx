import React from "react";
import { Link } from "react-router-dom";

export default function EventPlanningSteps({ steps, isOrganiser, deleteStep, id }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-medium">Planning steps</h2>
        {isOrganiser && (
          <div>
            <Link
              to={`/events/${id}/planning-steps/new`}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Create Step
            </Link>
          </div>
        )}
      </div>

      {steps.length === 0 ? (
        <div className="p-3 border rounded bg-white">No planning steps.</div>
      ) : (
        <ul className="space-y-2">
          {steps.map((s) => (
            <li
              key={s._id}
              className={
                "p-3 border rounded flex justify-between items-start " +
                (s.isCompleted
                  ? "bg-green-50 border-green-300"
                  : "bg-white")
              }
            >
              <div>
                <div className={"font-medium " + (s.isCompleted ? "text-green-700 line-through" : "")}>
                  {s.title}
                </div>
                {s.description && <div className="text-sm text-gray-600">{s.description}</div>}
                {s.dueDate && (
                  <div className="text-sm text-gray-500 mt-1">Due: {new Date(s.dueDate).toLocaleString()}</div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {isOrganiser && (
                  <>
                    <Link
                      to={`/events/${id}/planning-steps/${s._id}/edit`}
                      className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteStep(s._id)}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </>
                )}
                {s.isCompleted ? (
                  <p>Completed by: {s.completedBy?.name || '—'}</p>
                ) : (
                  <p>Last updated by: {s.updatedBy?.name || '—'}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
