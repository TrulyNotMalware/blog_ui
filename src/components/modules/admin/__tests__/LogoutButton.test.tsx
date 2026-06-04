// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogoutButton } from "../LogoutButton";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

function makeFetchMock() {
  return vi.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers(),
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  } as unknown as Response);
}

beforeEach(() => {
  mockPush.mockClear();
  mockRefresh.mockClear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("LogoutButton", () => {
  it("renders logout text", () => {
    makeFetchMock();
    render(<LogoutButton />);
    expect(screen.getByRole("button", { name: "logout" })).toBeInTheDocument();
  });

  it("clicking calls fetch POST /api/admin/auth/logout", async () => {
    const fetchMock = makeFetchMock();
    const user = userEvent.setup();
    render(<LogoutButton />);
    await user.click(screen.getByRole("button", { name: "logout" }));
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/auth/logout", { method: "POST" });
  });

  it("after click navigates to /admin/login", async () => {
    makeFetchMock();
    const user = userEvent.setup();
    render(<LogoutButton />);
    await user.click(screen.getByRole("button", { name: "logout" }));
    expect(mockPush).toHaveBeenCalledWith("/admin/login");
  });

  it("is disabled while busy", async () => {
    let resolveLogout!: (v: Response) => void;
    vi.spyOn(global, "fetch").mockReturnValue(
      new Promise<Response>((res) => {
        resolveLogout = res;
      }),
    );
    render(<LogoutButton />);
    const btn = screen.getByRole("button", { name: "logout" });
    // fireEvent.click is synchronous — triggers onClick, React batches setBusy(true)
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(btn).toBeDisabled();
    // Resolve fetch and let cleanup settle
    await act(async () => {
      resolveLogout({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(""),
      } as unknown as Response);
    });
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
  });
});
