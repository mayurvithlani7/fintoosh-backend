/**
 * API client for mobile -> backend communication.
 * Handles requests, chores, goals, rewards, point jars, and transactions.
 * Uses token from AsyncStorage (React Native).
 */
import * as Sentry from '@sentry/react-native';
import { API_URL } from './config';


// Global error handler - will be set by components that use the API
let globalShowError = null;

export const setGlobalErrorHandler = (showError) => {
  globalShowError = showError;
};

// Util for getting auth token from secure storage
async function getToken() {
  try {
    const { getAuthToken } = await import('./secureStorage');
    const token = await getAuthToken();
    return token || "";
  } catch (error) {
    console.error('Error getting token:', error);
    return "";
  }
}

// For React Native, we'll need to pass the token as a parameter or use a different approach
// Since this is a utility file, components will need to get the token themselves

// --- Requests ---
export async function fetchRequestsForUser(userId, token = null) {
  try {
    const authToken = token || await getToken();
    const headers = authToken ? { "Authorization": "Bearer " + authToken } : {};
    const res = await fetch(`${API_URL}/requests/${userId}`, { headers });
    if (!res.ok) {
      if (res.status >= 400 && res.status < 600 && globalShowError) {
        globalShowError("Request failed. Please try again.");
      }
      throw new Error("Failed to fetch requests");
    }
    return res.json();
  } catch (error) {
    // Sentry.captureException(error, {
    //   tags: { feature: 'requests', action: 'fetch' },
    //   extra: { userId, hasToken: !!token }
    // });
    throw error;
  }
}

export async function submitRequest(requestData, token = null) {
  try {
    const authToken = token || await getToken();
    // requestData: { userId, type, amount, ... }
    const headers = {
      "Content-Type": "application/json",
      ...(authToken ? { "Authorization": "Bearer " + authToken } : {})
    };
    const res = await fetch(`${API_URL}/requests`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestData)
    });
    if (!res.ok) {
      if (res.status >= 400 && res.status < 600 && globalShowError) {
        globalShowError("Request failed. Please try again.");
      }
      const err = await res.json().catch(() => ({}));
      throw new Error("Failed to submit request: " + (err.message || res.status));
    }
    return res.json();
  } catch (error) {
    // Sentry.captureException(error, {
    //   tags: { feature: 'requests', action: 'submit' },
    //   extra: { requestData, hasToken: !!token }
    // });
    throw error;
  }
}

// --- Chores ---
export async function fetchChores(userId, token = null) {
  try {
    const authToken = token || await getToken();
    const headers = authToken ? { "Authorization": "Bearer " + authToken } : {};
    const res = await fetch(`${API_URL}/chores/${userId}`, { headers });
    if (!res.ok) {
      if (res.status >= 400 && res.status < 600 && globalShowError) {
        globalShowError("Request failed. Please try again.");
      }
      throw new Error("Failed to fetch chores");
    }
    return res.json();
  } catch (error) {
    // Sentry.captureException(error, {
    //   tags: { feature: 'chores', action: 'fetch' },
    //   extra: { userId, hasToken: !!token }
    // });
    throw error;
  }
}

export async function patchChore(choreId, patchFields, token = null) {
  try {
    const authToken = token || await getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(authToken ? { "Authorization": "Bearer " + authToken } : {})
    };
    const res = await fetch(`${API_URL}/chores/${choreId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(patchFields)
    });
    if (!res.ok) {
      if (res.status >= 400 && res.status < 600 && globalShowError) {
        globalShowError("Request failed. Please try again.");
      }
      throw new Error("Failed to update chore");
    }
    return res.json();
  } catch (error) {
    // Sentry.captureException(error, {
    //   tags: { feature: 'chores', action: 'update' },
    //   extra: { choreId, patchFields, hasToken: !!token }
    // });
    throw error;
  }
}

// --- Goals ---
export async function fetchGoals(userId, token = null) {
  try {
    const authToken = token || await getToken();
    const headers = authToken ? { "Authorization": "Bearer " + authToken } : {};
    const res = await fetch(`${API_URL}/goals/${userId}`, { headers });
    if (!res.ok) {
      if (res.status >= 400 && res.status < 600 && globalShowError) {
        globalShowError("Request failed. Please try again.");
      }
      throw new Error("Failed to fetch goals");
    }
    return res.json();
  } catch (error) {
    // Sentry.captureException(error, {
    //   tags: { feature: 'goals', action: 'fetch' },
    //   extra: { userId, hasToken: !!token }
    // });
    throw error;
  }
}

// --- Rewards ---
export async function fetchRewards(userId, token = null) {
  try {
    const authToken = token || await getToken();
    const headers = authToken ? { "Authorization": "Bearer " + authToken } : {};
    const res = await fetch(`${API_URL}/rewards/${userId}`, { headers });
    if (!res.ok) {
      if (res.status >= 400 && res.status < 600 && globalShowError) {
        globalShowError("Request failed. Please try again.");
      }
      throw new Error("Failed to fetch rewards");
    }
    return res.json();
  } catch (error) {
    // Sentry.captureException(error, {
    //   tags: { feature: 'rewards', action: 'fetch' },
    //   extra: { userId, hasToken: !!token }
    // });
    throw error;
  }
}

// --- Add Reward (Parent) ---
export async function addReward({ childId, name, cost, description, category }, token = null) {
  try {
    const authToken = token || await getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(authToken ? { "Authorization": "Bearer " + authToken } : {})
    };
    const body = {
      childId,
      name,
      cost,
    };
    if (description) body.description = description;
    if (category) body.category = category;
    const res = await fetch(`${API_URL}/rewards`, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      if (res.status >= 400 && res.status < 600 && globalShowError) {
        globalShowError("Request failed. Please try again.");
      }
      const err = await res.json().catch(() => ({}));
      throw new Error("Failed to add reward: " + (err.message || res.status));
    }
    return res.json();
  } catch (error) {
    Sentry.captureException(error, {
      tags: { feature: 'rewards', action: 'add' },
      extra: { childId, name, cost, description, category, hasToken: !!token }
    });
    throw error;
  }
}

// --- Update User (for jars/points/etc) ---
export async function patchUserPoints(userId, patchFields, token = null) {
  try {
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": "Bearer " + token } : {})
    };
    const res = await fetch(`${API_URL}/users/${userId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(patchFields)
    });
    if (!res.ok) {
      if (res.status >= 400 && res.status < 600 && globalShowError) {
        globalShowError("Request failed. Please try again.");
      }
      throw new Error("Failed to patch user jars");
    }
    return res.json();
  } catch (error) {
    Sentry.captureException(error, {
      tags: { feature: 'users', action: 'patch-points' },
      extra: { userId, patchFields, hasToken: !!token }
    });
    throw error;
  }
}

// --- Transactions ---
export async function createTransaction(transactionData, token = null) {
  try {
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": "Bearer " + token } : {})
    };
    const res = await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers,
      body: JSON.stringify(transactionData)
    });
    if (!res.ok) {
      if (res.status >= 400 && res.status < 600 && globalShowError) {
        globalShowError("Request failed. Please try again.");
      }
      const err = await res.json().catch(() => ({}));
      throw new Error("Failed to create transaction: " + (err.message || res.status));
    }
    return res.json();
  } catch (error) {
    Sentry.captureException(error, {
      tags: { feature: 'transactions', action: 'create' },
      extra: { transactionData, hasToken: !!token }
    });
    throw error;
  }
}

export async function fetchTransactions(userId, token = null, page = 1, limit = 50) {
  try {
    const headers = token ? { "Authorization": "Bearer " + token } : {};
    const url = `${API_URL}/transactions/${userId}?page=${page}&limit=${limit}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      if (res.status >= 400 && res.status < 600 && globalShowError) {
        globalShowError("Request failed. Please try again.");
      }
      throw new Error("Failed to fetch transactions");
    }
    return res.json();
  } catch (error) {
    Sentry.captureException(error, {
      tags: { feature: 'transactions', action: 'fetch' },
      extra: { userId, page, limit, hasToken: !!token }
    });
    throw error;
  }
}

// --- Get User by ID ---
export async function fetchUser(userId, token) {
  try {
    const headers = token ? { "Authorization": "Bearer " + token } : {};
    const res = await fetch(`${API_URL}/users/${userId}`, { headers });
    if (!res.ok) {
      if (res.status >= 400 && res.status < 600 && globalShowError) {
        globalShowError("Request failed. Please try again.");
      }
      throw new Error("Failed to fetch user");
    }
    return res.json();
  } catch (error) {
    Sentry.captureException(error, {
      tags: { feature: 'users', action: 'fetch' },
      extra: { userId, hasToken: !!token }
    });
    throw error;
  }
}

// --- Get Family Children ---
export async function fetchFamilyChildren(familyId, token) {
  try {
    const headers = token ? { "Authorization": "Bearer " + token } : {};
    const res = await fetch(`${API_URL}/users?familyId=${familyId}&role=child`, { headers });
    if (!res.ok) {
      if (res.status >= 400 && res.status < 600 && globalShowError) {
        globalShowError("Request failed. Please try again.");
      }
      throw new Error("Failed to fetch family children");
    }
    return res.json();
  } catch (error) {
    Sentry.captureException(error, {
      tags: { feature: 'users', action: 'fetch-family-children' },
      extra: { familyId, hasToken: !!token }
    });
    throw error;
  }
}

export async function fetchNotifications(userId, token = null) {
  try {
    const headers = token ? { "Authorization": "Bearer " + token } : {};
    const res = await fetch(`${API_URL}/notifications?userId=${userId}`, { headers });
    if (!res.ok) {
      // Handle rate limiting specifically
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) : 60;
        if (globalShowError) {
          globalShowError(`Too many requests. Please wait ${waitTime} seconds before trying again.`);
        }
        throw new Error(`Too many requests. Please wait ${waitTime} seconds before trying again.`);
      }
      if (res.status >= 400 && res.status < 600 && globalShowError) {
        globalShowError("Request failed. Please try again.");
      }
      throw new Error("Failed to fetch notifications");
    }
    return res.json();
  } catch (error) {
    Sentry.captureException(error, {
      tags: { feature: 'notifications', action: 'fetch' },
      extra: { userId, hasToken: !!token }
    });
    throw error;
  }
}

export async function markNotificationRead(notifId, token = null) {
  try {
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": "Bearer " + token } : {})
    };
    const res = await fetch(`${API_URL}/notifications/${notifId}`, {
      method: "PATCH",
      headers
    });
    if (!res.ok) {
      if (res.status >= 400 && res.status < 600 && globalShowError) {
        globalShowError("Failed to mark notification as read");
      }
      throw new Error("Failed to mark notification as read");
    }
    return res.json();
  } catch (error) {
    Sentry.captureException(error, {
      tags: { feature: 'notifications', action: 'mark-read' },
      extra: { notifId, hasToken: !!token }
    });
    throw error;
  }
}

export async function markAllNotificationsRead(userId, token = null) {
  try {
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": "Bearer " + token } : {})
    };
    const res = await fetch(`${API_URL}/notifications/mark-all-read?userId=${userId}`, {
      method: "PATCH",
      headers
    });
    if (!res.ok) {
      if (res.status >= 400 && res.status < 600 && globalShowError) {
        globalShowError("Failed to mark notifications as read");
      }
      throw new Error("Failed to mark all notifications as read");
    }
    return res.json();
  } catch (error) {
    Sentry.captureException(error, {
      tags: { feature: 'notifications', action: 'mark-all-read' },
      extra: { userId, hasToken: !!token }
    });
    throw error;
  }
}

export default {
  fetchRequestsForUser,
  submitRequest,
  fetchChores,
  fetchGoals,
  fetchRewards,
  patchUserPoints,
  fetchUser,
  fetchFamilyChildren,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
