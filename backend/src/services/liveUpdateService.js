/**
 * Manages server-sent-event subscribers and pushes live marketplace events to them.
 */
const clients = new Map();

function toChannelSet(channels = []) {
  return new Set(
    channels
      .filter(Boolean)
      .map((channel) => String(channel).trim())
      .filter(Boolean),
  );
}

function serializeEvent(event, payload) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function sendEvent(client, event, payload) {
  try {
    client.res.write(serializeEvent(event, payload));
  } catch {
    removeLiveClient(client.id);
  }
}

export function addLiveClient({ id, userId, role, channels, res }) {
  const client = {
    id,
    userId: String(userId),
    role,
    channels: toChannelSet(channels),
    res,
  };

  clients.set(id, client);
  sendEvent(client, "connected", {
    clientId: id,
    channels: [...client.channels],
    timestamp: new Date().toISOString(),
  });

  return client;
}

export function removeLiveClient(clientId) {
  clients.delete(clientId);
}

export function sendLiveHeartbeat() {
  for (const client of clients.values()) {
    sendEvent(client, "heartbeat", {
      timestamp: new Date().toISOString(),
    });
  }
}

export function publishLiveEvent({
  event = "update",
  channels = [],
  userIds = [],
  roles = [],
  payload = {},
}) {
  const targetChannels = toChannelSet(channels);
  const targetUsers = new Set(userIds.filter(Boolean).map((userId) => String(userId)));
  const targetRoles = new Set(roles.filter(Boolean).map((role) => String(role)));

  for (const client of clients.values()) {
    const channelMatch =
      !targetChannels.size ||
      [...targetChannels].some((channel) => client.channels.has(channel));
    const userMatch = !targetUsers.size || targetUsers.has(client.userId);
    const roleMatch = !targetRoles.size || targetRoles.has(client.role);

    if (channelMatch && userMatch && roleMatch) {
      sendEvent(client, event, {
        ...payload,
        event,
        channels: [...targetChannels],
        timestamp: new Date().toISOString(),
      });
    }
  }
}
