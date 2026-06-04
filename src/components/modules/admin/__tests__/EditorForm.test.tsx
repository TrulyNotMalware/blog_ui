// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/api/client";

// --- mocks (must be declared before component import) ---

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockRemove = vi.fn();
const mockPublish = vi.fn();

vi.mock("@/services/postService", () => ({
  postService: {
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    remove: (...args: unknown[]) => mockRemove(...args),
    publish: (...args: unknown[]) => mockPublish(...args),
  },
}));

vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));

vi.mock("@/components/modules/blog/MarkdownContent", () => ({
  MarkdownContent: () => null,
}));

vi.mock("@/components/modules/admin/Shell", () => ({
  AdminShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  StatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

vi.mock("@/components/modules/admin/Editor", () => ({
  AdminEditor: ({
    source,
    actions,
  }: {
    source: React.ReactNode;
    preview: React.ReactNode;
    actions: React.ReactNode;
    tabs?: unknown;
    status?: unknown;
  }) => (
    <div>
      {source}
      <div data-testid="actions">{actions}</div>
    </div>
  ),
}));

import { EditorForm } from "../EditorForm";
import type { PostAdmin } from "@/types";

// parseTags is internal; test via postService.create payload


// ---

function makePost(overrides: Partial<PostAdmin> = {}): PostAdmin {
  return {
    id: "test-post",
    title: "Test Title",
    excerpt: "Test excerpt",
    tags: ["tag1", "tag2"],
    date: "2025-01-01",
    kind: "essay",
    content: "Some content",
    status: "draft",
    views: 0,
    readTime: "1분",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  mockPush.mockClear();
  mockRefresh.mockClear();
  mockCreate.mockClear();
  mockUpdate.mockClear();
  mockRemove.mockClear();
  mockPublish.mockClear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("EditorForm", () => {
  describe("mode=new", () => {
    it("renders empty form with today's date", () => {
      const { container } = render(<EditorForm mode="new" />);
      const idInput = within(container).getByPlaceholderText("my-post") as HTMLInputElement;
      expect(idInput.value).toBe("");

      const today = new Date();
      const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const dateInput = within(container).getByDisplayValue(expected) as HTMLInputElement;
      expect(dateInput).toBeInTheDocument();
    });

    it("save draft with empty id/title shows error, no API call", async () => {
      const user = userEvent.setup();
      const { container } = render(<EditorForm mode="new" />);
      await user.click(within(container).getByRole("button", { name: /save draft/i }));
      await waitFor(() =>
        expect(within(container).getByRole("alert")).toHaveTextContent(
          "id 와 title 은 필수입니다",
        ),
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("save draft with valid form calls postService.create with status draft and navigates", async () => {
      mockCreate.mockResolvedValue({ id: "new-post", status: "draft" });
      const user = userEvent.setup();
      const { container } = render(<EditorForm mode="new" />);

      await user.type(within(container).getByPlaceholderText("my-post"), "new-post");
      // title input: only text input without a placeholder among the text inputs
      const inputs = within(container).getAllByRole("textbox") as HTMLInputElement[];
      const titleInput = inputs.find((el) => el.placeholder === "" && el.type === "text" && el.value === "");
      await user.type(titleInput!, "My Title");
      await user.click(within(container).getByRole("button", { name: /save draft/i }));

      await waitFor(() => expect(mockCreate).toHaveBeenCalledOnce());
      const [payload] = mockCreate.mock.calls[0];
      expect(payload).toMatchObject({ id: "new-post", status: "draft" });
      expect(mockPush).toHaveBeenCalledWith("/admin/edit/new-post");
    });

    it("publish (new) calls postService.create with status published", async () => {
      mockCreate.mockResolvedValue({ id: "new-post", status: "published" });
      const user = userEvent.setup();
      const { container } = render(<EditorForm mode="new" />);

      await user.type(within(container).getByPlaceholderText("my-post"), "new-post");
      const inputs = within(container).getAllByRole("textbox") as HTMLInputElement[];
      const titleInput = inputs.find((el) => el.placeholder === "" && el.type === "text" && el.value === "");
      await user.type(titleInput!, "My Title");
      await user.click(within(container).getByRole("button", { name: /^publish$/i }));

      await waitFor(() => expect(mockCreate).toHaveBeenCalledOnce());
      const [payload] = mockCreate.mock.calls[0];
      expect(payload).toMatchObject({ id: "new-post", status: "published" });
    });

    it("API error on save draft surfaces in error UI", async () => {
      mockCreate.mockRejectedValue(
        new ApiError("Bad Request", 400, { detail: "slug already exists" }),
      );
      const user = userEvent.setup();
      const { container } = render(<EditorForm mode="new" />);

      await user.type(within(container).getByPlaceholderText("my-post"), "dup-post");
      const inputs = within(container).getAllByRole("textbox") as HTMLInputElement[];
      const titleInput = inputs.find((el) => el.placeholder === "" && el.type === "text" && el.value === "");
      await user.type(titleInput!, "Dup Title");
      await user.click(within(container).getByRole("button", { name: /save draft/i }));

      await waitFor(() =>
        expect(within(container).getByRole("alert")).toHaveTextContent("slug already exists"),
      );
    });
  });

  describe("mode=edit", () => {
    it("pre-populates form with initial values", () => {
      const post = makePost();
      const { container } = render(<EditorForm mode="edit" initial={post} />);
      expect(within(container).getByDisplayValue("test-post")).toBeInTheDocument();
      expect(within(container).getByDisplayValue("Test Title")).toBeInTheDocument();
      expect(within(container).getByDisplayValue("2025-01-01")).toBeInTheDocument();
    });

    it("update calls postService.update", async () => {
      const post = makePost();
      mockUpdate.mockResolvedValue({ ...post, status: "draft" });
      const user = userEvent.setup();
      const { container } = render(<EditorForm mode="edit" initial={post} />);
      await user.click(within(container).getByRole("button", { name: /^update$/i }));
      await waitFor(() => expect(mockUpdate).toHaveBeenCalledOnce());
      expect(mockUpdate).toHaveBeenCalledWith("test-post", expect.any(Object));
    });

    it("delete confirms, calls postService.remove, navigates to /admin", async () => {
      const post = makePost();
      mockRemove.mockResolvedValue(null);
      vi.spyOn(window, "confirm").mockReturnValue(true);
      const user = userEvent.setup();
      const { container } = render(<EditorForm mode="edit" initial={post} />);
      await user.click(within(container).getByRole("button", { name: /^delete$/i }));
      await waitFor(() => expect(mockRemove).toHaveBeenCalledWith("test-post"));
      expect(mockPush).toHaveBeenCalledWith("/admin");
    });

    it("delete without confirm does not call postService.remove", async () => {
      const post = makePost();
      vi.spyOn(window, "confirm").mockReturnValue(false);
      const user = userEvent.setup();
      const { container } = render(<EditorForm mode="edit" initial={post} />);
      await user.click(within(container).getByRole("button", { name: /^delete$/i }));
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it("publish (existing draft) calls postService.publish", async () => {
      const post = makePost({ status: "draft" });
      mockPublish.mockResolvedValue({ ...post, status: "published" });
      const user = userEvent.setup();
      const { container } = render(<EditorForm mode="edit" initial={post} />);
      await user.click(within(container).getByRole("button", { name: /^publish$/i }));
      await waitFor(() => expect(mockPublish).toHaveBeenCalledWith("test-post"));
    });

    it("save as draft (existing published) calls postService.update with status draft", async () => {
      const post = makePost({ status: "published" });
      mockUpdate.mockResolvedValue({ ...post, status: "draft" });
      const user = userEvent.setup();
      const { container } = render(<EditorForm mode="edit" initial={post} />);
      await user.click(within(container).getByRole("button", { name: /save as draft/i }));
      await waitFor(() => expect(mockUpdate).toHaveBeenCalledOnce());
      expect(mockUpdate).toHaveBeenCalledWith("test-post", { status: "draft" });
    });

    it("API error on update surfaces in error UI", async () => {
      const post = makePost();
      mockUpdate.mockRejectedValue(
        new ApiError("Server Error", 500, { detail: "업데이트 중 오류" }),
      );
      const user = userEvent.setup();
      const { container } = render(<EditorForm mode="edit" initial={post} />);
      await user.click(within(container).getByRole("button", { name: /^update$/i }));
      await waitFor(() =>
        expect(within(container).getByRole("alert")).toHaveTextContent("업데이트 중 오류"),
      );
    });
  });
});
