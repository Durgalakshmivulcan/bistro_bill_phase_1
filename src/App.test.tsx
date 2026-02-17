import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: {
    fire: jest.fn(),
    mixin: () => ({
      fire: jest.fn(),
    }),
  },
}));

test("renders login screen", () => {
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
});
