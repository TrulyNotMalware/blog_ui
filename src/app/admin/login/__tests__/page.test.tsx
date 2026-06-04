// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup, within, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminLoginPage from "../page";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

function mockFetch(status: number, body: unknown = {}) {
  vi.spyOn(global, "fetch").mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 401 ? "Unauthorized" : status === 500 ? "Internal Server Error" : "OK",
    headers: new Headers({ "content-type": "application/json" }),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
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

describe("AdminLoginPage", () => {
  it("submitting valid form POSTs to /api/admin/auth/login with JSON body", async () => {
    mockFetch(200);
    const user = userEvent.setup();
    const { container } = render(<AdminLoginPage />);
    await user.type(within(container).getByRole("textbox", { name: /username/i }), "admin");
    await user.type(within(container).getByLabelText(/password/i), "secret");
    await user.click(within(container).getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("/api/admin/auth/login");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body).toEqual({ username: "admin", password: "secret" });
  });

  it("on 200 navigates to /admin", async () => {
    mockFetch(200);
    const user = userEvent.setup();
    const { container } = render(<AdminLoginPage />);
    await user.type(within(container).getByRole("textbox", { name: /username/i }), "admin");
    await user.type(within(container).getByLabelText(/password/i), "secret");
    await user.click(within(container).getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/admin"));
  });

  it("on 401 shows 잘못된 자격증명입니다 error", async () => {
    mockFetch(401);
    const user = userEvent.setup();
    const { container } = render(<AdminLoginPage />);
    await user.type(within(container).getByRole("textbox", { name: /username/i }), "admin");
    await user.type(within(container).getByLabelText(/password/i), "wrong");
    await user.click(within(container).getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(within(container).getByRole("alert")).toHaveTextContent("잘못된 자격증명입니다"),
    );
  });

  it("on other failure shows 로그인 실패 (status)", async () => {
    mockFetch(500);
    const user = userEvent.setup();
    const { container } = render(<AdminLoginPage />);
    await user.type(within(container).getByRole("textbox", { name: /username/i }), "admin");
    await user.type(within(container).getByLabelText(/password/i), "secret");
    await user.click(within(container).getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(within(container).getByRole("alert")).toHaveTextContent("로그인 실패 (500)"),
    );
  });

  it("on fetch throw shows 네트워크 오류", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));
    const user = userEvent.setup();
    const { container } = render(<AdminLoginPage />);
    await user.type(within(container).getByRole("textbox", { name: /username/i }), "admin");
    await user.type(within(container).getByLabelText(/password/i), "secret");
    await user.click(within(container).getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(within(container).getByRole("alert")).toHaveTextContent("네트워크 오류"),
    );
  });

  it("submit button is disabled while busy", async () => {
    let resolveFetch!: (v: Response) => void;
    vi.spyOn(global, "fetch").mockReturnValue(
      new Promise<Response>((res) => {
        resolveFetch = res;
      }),
    );
    const user = userEvent.setup();
    const { container } = render(<AdminLoginPage />);
    await user.type(within(container).getByRole("textbox", { name: /username/i }), "admin");
    await user.type(within(container).getByLabelText(/password/i), "secret");
    const submitBtn = within(container).getByRole("button", { name: /sign in/i });
    // fireEvent.submit triggers the form submit synchronously; React batches setBusy(true)
    await act(async () => {
      fireEvent.submit(submitBtn.closest("form")!);
    });
    expect(submitBtn).toBeDisabled();
    await act(async () => {
      resolveFetch({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve({}),
        text: () => Promise.resolve("{}"),
      } as unknown as Response);
    });
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
  });
});
