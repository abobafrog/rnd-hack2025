import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCClientProvider } from "@/lib/trpc";
import Home from "@/pages/Home";
import CreateRoom from "@/pages/CreateRoom";
import Room from "@/pages/Room";

// Мокаем tRPC клиент
const mockTrpcClient = {
  auth: {
    me: {
      useQuery: vi.fn(() => ({
        data: { id: 1, name: "Test User", email: "test@example.com" },
        isLoading: false,
        error: null
      }))
    },
    logout: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false,
        error: null
      }))
    }
  },
  room: {
    create: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false,
        error: null
      }))
    },
    get: {
      useQuery: vi.fn(() => ({
        data: null,
        isLoading: false,
        error: null
      }))
    },
    join: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false,
        error: null
      }))
    },
    participants: {
      useQuery: vi.fn(() => ({
        data: [],
        isLoading: false,
        error: null
      }))
    }
  },
  chat: {
    send: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false,
        error: null
      }))
    },
    messages: {
      useQuery: vi.fn(() => ({
        data: [],
        isLoading: false,
        error: null
      }))
    }
  }
};

// Обертка для тестов с провайдерами
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCClientProvider client={mockTrpcClient as any}>
        {children}
      </TRPCClientProvider>
    </QueryClientProvider>
  );
}

describe("React Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Home Component", () => {
    it("should render home page", () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });

    it("should show create room button", () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      const createButton = screen.getByRole("button", { name: /create room/i });
      expect(createButton).toBeInTheDocument();
    });
  });

  describe("CreateRoom Component", () => {
    it("should render create room form", () => {
      render(
        <TestWrapper>
          <CreateRoom />
        </TestWrapper>
      );

      expect(screen.getByText(/create new room/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/room name/i)).toBeInTheDocument();
    });

    it("should handle form submission", async () => {
      const mockMutate = vi.fn();
      mockTrpcClient.room.create.useMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null
      });

      render(
        <TestWrapper>
          <CreateRoom />
        </TestWrapper>
      );

      const nameInput = screen.getByPlaceholderText(/room name/i);
      const submitButton = screen.getByRole("button", { name: /create/i });

      fireEvent.change(nameInput, { target: { value: "Test Room" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({ name: "Test Room" });
      });
    });

    it("should show loading state", () => {
      mockTrpcClient.room.create.useMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: true,
        error: null
      });

      render(
        <TestWrapper>
          <CreateRoom />
        </TestWrapper>
      );

      const submitButton = screen.getByRole("button", { name: /create/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Room Component", () => {
    it("should render room page", () => {
      mockTrpcClient.room.get.useQuery.mockReturnValue({
        data: {
          id: 1,
          name: "Test Room",
          roomCode: "test123",
          ownerId: 1
        },
        isLoading: false,
        error: null
      });

      render(
        <TestWrapper>
          <Room params={{ code: "test123" }} />
        </TestWrapper>
      );

      expect(screen.getByText("Test Room")).toBeInTheDocument();
      expect(screen.getByText("test123")).toBeInTheDocument();
    });

    it("should show loading state", () => {
      mockTrpcClient.room.get.useQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });

      render(
        <TestWrapper>
          <Room params={{ code: "test123" }} />
        </TestWrapper>
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it("should show error state", () => {
      mockTrpcClient.room.get.useQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Room not found")
      });

      render(
        <TestWrapper>
          <Room params={{ code: "test123" }} />
        </TestWrapper>
      );

      expect(screen.getByText(/room not found/i)).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", () => {
      mockTrpcClient.auth.me.useQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Authentication failed")
      });

      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

      // Компонент должен рендериться даже при ошибке
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });
});

