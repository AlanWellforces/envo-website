import { Container } from "./container";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <Container>
        <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ENVO. A brand of Wellforces Ltd.
          </p>
          <p className="text-xs text-muted-foreground">
            B2B lighting solutions
          </p>
        </div>
      </Container>
    </footer>
  );
}
