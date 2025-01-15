import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useSignIn from "react-auth-kit/hooks/useSignIn";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import axios from "axios";
import { AuthError } from "react-auth-kit/errors";

const LoginComponent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const signIn = useSignIn();
  const auth = useAuthHeader();

  useEffect(() => {
    if (auth) {
      navigate("/main");
    }
  }, [auth]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const body = {
      email,
      password,
    };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/auth/login`,
        body
      );

      if (response) {
        console.log("res", response);
        const isAuthenticated = signIn({
          auth: {
            token: response.data.tokens.access.token,
            type: "Bearer",
          },
          userState: response.data.user.name,
        });
        if (isAuthenticated) {
          navigate("/main");
        }
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
      console.log("err", err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800">Login</h2>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-4 py-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
              placeholder="Enter your email or email"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-4 py-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginComponent;
