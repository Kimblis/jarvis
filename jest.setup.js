// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock the fetch API
global.fetch = jest.fn();

// Mock Next.js Router
jest.mock("next/router", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    pathname: "/",
    route: "/",
    asPath: "/",
    query: {},
  })),
}));

// Mock environment variables if needed
process.env.OPENAI_API_KEY = "test-api-key";

// Suppress console errors during tests
console.error = jest.fn();

// Reset all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
