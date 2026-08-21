import React, { useState } from "react";
import { Hash, Plus, X as XIcon, Loader2 } from "lucide-react";

// Sub-component for access control select rows
function AccessControlRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between text-xs py-1">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <select
        className="input"
        style={{ padding: "4px 8px", fontSize: 12, borderRadius: 4 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="everyone">Everyone</option>
        <option value="roles">Specific Roles</option>
        <option value="owner">Owner Only</option>
      </select>
    </div>
  );
}

export default function SettingsChannelsView({ view = "settings", settingsPage = "channels" }) {
  // State management
  const [sections, setSections] = useState([
    { id: "1", name: "General" },
    { id: "2", name: "Community" },
  ]);
  const [channels, setChannels] = useState([
    { id: "1", name: "welcome", type: "text", visibility: "public", canSendMessages: true },
    { id: "2", name: "announcements", type: "announcement", visibility: "restricted", canSendMessages: false },
  ]);

  const [newSectionName, setNewSectionName] = useState("");
  const [creatingSection, setCreatingSection] = useState(false);

  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState("text");
  const [creatingChannel, setCreatingChannel] = useState(false);

  // Access Control selections
  const [viewAccess, setViewAccess] = useState("everyone");
  const [sendAccess, setSendAccess] = useState("everyone");
  const [attachAccess, setAttachAccess] = useState("everyone");
  const [manageAccess, setManageAccess] = useState("owner");

  // Section handlers
  const handleCreateSection = (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    setCreatingSection(true);

    setTimeout(() => {
      setSections([...sections, { id: Date.now().toString(), name: newSectionName.trim() }]);
      setNewSectionName("");
      setCreatingSection(false);
    }, 400);
  };

  const handleDeleteSection = (sectionToDelete) => {
    setSections(sections.filter((s) => s.id !== sectionToDelete.id));
  };

  // Channel handlers
  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    setCreatingChannel(true);

    setTimeout(() => {
      setChannels([
        ...channels,
        {
          id: Date.now().toString(),
          name: newChannelName.trim().toLowerCase().replace(/\s+/g, "-"),
          type: newChannelType,
          viewAccess: { type: viewAccess },
          sendAccess: { type: sendAccess },
        },
      ]);
      setNewChannelName("");
      setCreatingChannel(false);
    }, 400);
  };

  const handleDeleteChannel = (channelToDelete) => {
    setChannels(channels.filter((c) => c.id !== channelToDelete.id));
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {view === "settings" && settingsPage === "channels" && (
        <div className="space-y-4">
          {/* Overview Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="card p-3">
              <div className="text-xl font-semibold">{sections.length}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Categories
              </div>
            </div>
            <div className="card p-3">
              <div className="text-xl font-semibold">{channels.length}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Channels
              </div>
            </div>
          </div>

          {/* Categories Management */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
              Categories
            </h3>
            <div className="space-y-1 mb-3">
              {sections.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm py-1">
                  <span>{s.name}</span>
                  <button
                    onClick={() => handleDeleteSection(s)}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                    aria-label={`Delete ${s.name}`}
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleCreateSection} className="flex items-center gap-2">
              <input
                className="input pl-3"
                style={{ padding: "8px 10px", fontSize: 13, flex: 1 }}
                placeholder="New category name"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
              />
              <button
                type="submit"
                className="btn-primary flex items-center justify-center gap-1"
                style={{ maxWidth: 90, padding: "8px 12px" }}
                disabled={creatingSection || !newSectionName.trim()}
              >
                {creatingSection ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Plus size={14} /> Add
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Channels Table */}
          <div className="card p-4" style={{ overflowX: "auto" }}>
            <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
              Channels
            </h3>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "var(--text-muted)", textAlign: "left" }}>
                  <th style={{ padding: "6px 8px" }}>Channel</th>
                  <th style={{ padding: "6px 8px" }}>Type</th>
                  <th style={{ padding: "6px 8px" }}>Visible To</th>
                  <th style={{ padding: "6px 8px" }}>Can Send</th>
                  <th style={{ padding: "6px 8px" }}></th>
                </tr>
              </thead>
              <tbody>
                {channels.map((c) => (
                  <tr key={c.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "6px 8px" }}>
                      <Hash size={12} style={{ display: "inline", marginRight: 4 }} />
                      {c.name}
                    </td>
                    <td style={{ padding: "6px 8px", textTransform: "capitalize" }}>{c.type}</td>
                    <td style={{ padding: "6px 8px" }}>
                      {(c.viewAccess?.type || (c.visibility === "restricted" ? "roles" : "everyone")).replace("_", " ")}
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      {(c.sendAccess?.type || (c.canSendMessages ? "everyone" : "owner")).replace("_", " ")}
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      {channels.length > 1 && (
                        <button
                          onClick={() => handleDeleteChannel(c)}
                          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                          aria-label={`Delete #${c.name}`}
                        >
                          <XIcon size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Create Channel Form */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold mb-3" style={{ color: "var(--text-muted)" }}>
              Create Channel
            </h3>
            <form onSubmit={handleCreateChannel} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>
                    Channel Name
                  </label>
                  <input
                    className="input w-full"
                    style={{ padding: "8px 10px", fontSize: 13 }}
                    placeholder="e.g. general"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>
                    Channel Type
                  </label>
                  <select
                    className="input w-full"
                    style={{ padding: "8px 10px", fontSize: 13 }}
                    value={newChannelType}
                    onChange={(e) => setNewChannelType(e.target.value)}
                  >
                    <option value="text">Text</option>
                    <option value="announcement">Announcement</option>
                    <option value="voice">Voice</option>
                  </select>
                </div>
              </div>

              {/* Access Control Rows */}
              <div className="space-y-2 pt-2">
                <AccessControlRow label="View Access" value={viewAccess} onChange={setViewAccess} />
                <AccessControlRow label="Send Messages" value={sendAccess} onChange={setSendAccess} />
                <AccessControlRow label="Attach Files" value={attachAccess} onChange={setAttachAccess} />
                <AccessControlRow label="Manage Settings" value={manageAccess} onChange={setManageAccess} />
              </div>

              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-1 mt-3"
                style={{ padding: "8px 12px" }}
                disabled={creatingChannel || !newChannelName.trim()}
              >
                {creatingChannel ? <Loader2 size={14} className="animate-spin" /> : "Create Channel"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
