import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import StoryLibrary from "./pages/StoryLibrary";
import CreateStory from "./pages/CreateStory";
import StoryReader from "./pages/StoryReader";
import StoryChat from "./pages/StoryChat";
import ReadAlong from "./pages/ReadAlong";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import Settings from "./pages/Settings";
import CategoryDetail from "./pages/CategoryDetail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/library" component={StoryLibrary} />
      <Route path="/create" component={CreateStory} />
      <Route path="/story/:id" component={StoryReader} />
      <Route path="/story/:id/chat" component={StoryChat} />
      <Route path="/story/:id/read-along" component={ReadAlong} />
      <Route path="/profile" component={Profile} />
      <Route path="/profile/edit" component={ProfileEdit} />
      <Route path="/settings" component={Settings} />
      <Route path="/category/:name" component={CategoryDetail} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
