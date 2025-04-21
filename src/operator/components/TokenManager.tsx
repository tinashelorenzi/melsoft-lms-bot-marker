import React, { useState, useEffect } from "react";
import axios from "axios";

interface Token {
  token: string;
  name: string;
  role: string;
  createdAt: string;
}

interface WhitelistedToken {
  token: string;
  name: string;
  role: string;
  createdAt: string;
}

// API base URL - change this to match your server
const API_BASE_URL = "http://localhost:3000";

export const TokenManager: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [whitelistedTokens, setWhitelistedTokens] = useState<
    WhitelistedToken[]
  >([]);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenRole, setNewTokenRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTokens();
    loadWhitelistedTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const token = localStorage.getItem("operatorToken");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/operator/tokens`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTokens(response.data.tokens);
    } catch (err) {
      setError("Failed to load tokens");
      console.error("Error loading tokens:", err);
    }
  };

  const loadWhitelistedTokens = async () => {
    try {
      const token = localStorage.getItem("operatorToken");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/operator/whitelist`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setWhitelistedTokens(response.data.tokens);
    } catch (err) {
      setError("Failed to load whitelisted tokens");
      console.error("Error loading whitelisted tokens:", err);
    }
  };

  const generateToken = async () => {
    if (!newTokenName || !newTokenRole) {
      setError("Please provide both name and role for the token");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("operatorToken");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/operator/tokens`,
        {
          name: newTokenName,
          role: newTokenRole,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTokens([...tokens, response.data]);
      setNewTokenName("");
      setNewTokenRole("");
      setSuccess("Token generated successfully");
    } catch (err) {
      setError("Failed to generate token");
      console.error("Error generating token:", err);
    } finally {
      setLoading(false);
    }
  };

  const whitelistToken = async (token: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const operatorToken = localStorage.getItem("operatorToken");
      if (!operatorToken) {
        setError("No authentication token found");
        return;
      }

      await axios.post(
        `${API_BASE_URL}/api/operator/whitelist`,
        { token },
        {
          headers: {
            Authorization: `Bearer ${operatorToken}`,
          },
        }
      );
      await loadWhitelistedTokens();
      setSuccess("Token whitelisted successfully");
    } catch (err) {
      setError("Failed to whitelist token");
      console.error("Error whitelisting token:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWhitelist = async (token: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const operatorToken = localStorage.getItem("operatorToken");
      if (!operatorToken) {
        setError("No authentication token found");
        return;
      }

      await axios.delete(`${API_BASE_URL}/api/operator/whitelist/${token}`, {
        headers: {
          Authorization: `Bearer ${operatorToken}`,
        },
      });
      await loadWhitelistedTokens();
      setSuccess("Token removed from whitelist");
    } catch (err) {
      setError("Failed to remove token from whitelist");
      console.error("Error removing token from whitelist:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">API Token Management</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Generate New Token</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token Name
            </label>
            <input
              type="text"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., Production API Token"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              type="text"
              value={newTokenRole}
              onChange={(e) => setNewTokenRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., admin"
            />
          </div>
        </div>
        <button
          onClick={generateToken}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Token"}
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Generated Tokens</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tokens.map((token) => (
                <tr key={token.token}>
                  <td className="px-6 py-4 whitespace-nowrap">{token.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{token.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      {token.token}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(token.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => whitelistToken(token.token)}
                      disabled={loading}
                      className="text-indigo-600 hover:text-indigo-900 mr-2"
                    >
                      Whitelist
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Whitelisted Tokens</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {whitelistedTokens.map((token) => (
                <tr key={token.token}>
                  <td className="px-6 py-4 whitespace-nowrap">{token.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{token.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      {token.token}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(token.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => removeFromWhitelist(token.token)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
