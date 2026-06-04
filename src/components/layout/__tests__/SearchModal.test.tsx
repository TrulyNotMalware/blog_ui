// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSearch = vi.fn();
vi.mock("@/services/postService", () => ({
  postService: {
    search: (...args: unknown[]) => mockSearch(...args),
  },
}));

vi.mock("@/hooks/query/useTagsQuery", () => ({
  useTagsQuery: () => ({ data: [], isLoading: false, isError: false }),
}));

import { SearchModal } from "../SearchModal";
import { useUIStore } from "@/stores/useUIStore";

function openModal(q = ""): void {
  act(() => {
    useUIStore.setState({ isSearchOpen: true, searchQuery: q });
  });
}

function resetStore(): void {
  act(() => {
    useUIStore.setState({ isSearchOpen: false, searchQuery: "" });
  });
}

describe("SearchModal", () => {
  beforeEach(() => {
    mockSearch.mockReset();
    resetStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("isSearchOpen=false 일 때 렌더 안 됨", () => {
    render(<SearchModal />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("isSearchOpen=true 면 dialog 렌더", () => {
    openModal();
    render(<SearchModal />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("빈 q 에서는 search 호출 안 함", () => {
    openModal("");
    render(<SearchModal />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("q 입력 시 debounce 300ms 후 search 호출", () => {
    mockSearch.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 8 });
    openModal();
    render(<SearchModal />);

    act(() => {
      useUIStore.setState({ searchQuery: "spring" });
    });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(mockSearch).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(mockSearch.mock.calls[0][0]).toMatchObject({ q: "spring", pageSize: 8 });
  });

  it("빠른 연속 입력은 마지막 q 한 번만 호출", () => {
    mockSearch.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 8 });
    openModal();
    render(<SearchModal />);

    act(() => useUIStore.setState({ searchQuery: "a" }));
    act(() => vi.advanceTimersByTime(100));
    act(() => useUIStore.setState({ searchQuery: "ab" }));
    act(() => vi.advanceTimersByTime(100));
    act(() => useUIStore.setState({ searchQuery: "abc" }));
    act(() => vi.advanceTimersByTime(400));

    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(mockSearch.mock.calls[0][0].q).toBe("abc");
  });

  it("AbortController: 디바운스 사이 q 변경 시 이전 fetch abort", async () => {
    let firstSignal: AbortSignal | undefined;
    mockSearch.mockImplementation((_p: unknown, signal: AbortSignal) => {
      if (!firstSignal) firstSignal = signal;
      return new Promise(() => {});
    });
    openModal();
    render(<SearchModal />);

    act(() => useUIStore.setState({ searchQuery: "a" }));
    act(() => vi.advanceTimersByTime(300));
    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(firstSignal?.aborted).toBe(false);

    act(() => useUIStore.setState({ searchQuery: "b" }));
    expect(firstSignal?.aborted).toBe(true);
  });

  it("Escape 키 → closeSearch", () => {
    openModal();
    render(<SearchModal />);
    expect(useUIStore.getState().isSearchOpen).toBe(true);

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(useUIStore.getState().isSearchOpen).toBe(false);
  });

  it("결과 렌더링", async () => {
    mockSearch.mockResolvedValue({
      items: [
        {
          id: "post-1",
          title: "Spring Boot",
          excerpt: "x",
          tags: ["spring"],
          date: "2025-01-01",
          kind: "essay",
          readTime: "1분",
          views: 0,
          featured: false,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 8,
    });
    openModal();
    render(<SearchModal />);

    act(() => useUIStore.setState({ searchQuery: "spring" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(screen.getByText("Spring Boot")).toBeInTheDocument();
  });
});

describe("SearchModal — close button (real timers)", () => {
  beforeEach(() => {
    mockSearch.mockReset();
    act(() => {
      useUIStore.setState({ isSearchOpen: true, searchQuery: "" });
    });
  });

  afterEach(() => {
    act(() => {
      useUIStore.setState({ isSearchOpen: false, searchQuery: "" });
    });
    cleanup();
  });

  it("esc 버튼 클릭 → closeSearch", async () => {
    const user = userEvent.setup();
    render(<SearchModal />);
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(useUIStore.getState().isSearchOpen).toBe(false);
  });
});
