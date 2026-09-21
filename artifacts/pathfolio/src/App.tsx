import { useEffect, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ClerkProvider,
  RedirectToSignIn,
  Show,
  SignIn,
  SignUp,
  useAuth,
  useClerk,
  useUser,
} from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Download,
  FileText,
  GraduationCap,
  LayoutTemplate,
  LoaderCircle,
  LockKeyhole,
  Menu,
  Palette,
  PencilLine,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  Sparkles,
  Trash2,
  UserRound,
  WandSparkles,
  X,
} from 'lucide-react';
import {
  getGetResumeQueryKey,
  getGetResumeSummaryQueryKey,
  useGetResume,
  useGetResumeSummary,
  useSaveResume,
  setBaseUrl,
  type Education,
  type Experience,
  type Project,
  type ResumeBasics,
  type ResumeInput,
  type Skill,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import './index.css';

const queryClient = new QueryClient();
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || '';

setBaseUrl(apiBaseUrl || null);

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#247c73',
    colorForeground: '#27373a',
    colorMutedForeground: '#687772',
    colorDanger: '#b6463c',
    colorBackground: '#fcfaf4',
    colorInput: '#f5f1e8',
    colorInputForeground: '#27373a',
    colorNeutral: '#d8d0c1',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.8rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fcfaf4] rounded-[26px] w-[440px] max-w-full overflow-hidden border border-[#e5ded0]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#27373a] font-semibold',
    headerSubtitle: 'text-[#687772]',
    socialButtonsBlockButtonText: 'text-[#27373a]',
    formFieldLabel: 'text-[#27373a]',
    footerActionLink: 'text-[#247c73] font-semibold',
    footerActionText: 'text-[#687772]',
    dividerText: 'text-[#687772]',
    identityPreviewEditButton: 'text-[#247c73]',
    formFieldSuccessText: 'text-[#247c73]',
    alertText: 'text-[#b6463c]',
    logoBox: 'rounded-xl',
    logoImage: 'rounded-xl',
    socialButtonsBlockButton: 'border-[#d8d0c1] bg-[#f5f1e8] hover:bg-[#eee8dc]',
    formButtonPrimary: 'bg-[#247c73] hover:bg-[#1d665f] text-[#fcfaf4]',
    formFieldInput: 'border-[#d8d0c1] bg-[#f5f1e8] text-[#27373a]',
    footerAction: 'border-t border-[#e5ded0]',
    dividerLine: 'bg-[#e5ded0]',
    alert: 'border-[#e1b9b2] bg-[#fbefec]',
    otpCodeFieldInput: 'border-[#d8d0c1] bg-[#f5f1e8] text-[#27373a]',
    formFieldRow: 'gap-2',
    main: 'px-2',
  },
};

type TemplateName = 'editorial' | 'folio' | 'signal';
type AccentName = 'teal' | 'coral' | 'ochre' | 'ink';

const accents: Record<AccentName, { label: string; value: string; soft: string }> = {
  teal: { label: 'Sea glass', value: '#247c73', soft: '#dcece6' },
  coral: { label: 'Terracotta', value: '#c76152', soft: '#f3dfd6' },
  ochre: { label: 'Golden hour', value: '#a8732e', soft: '#f1e6c9' },
  ink: { label: 'Deep ink', value: '#315568', soft: '#dce7eb' },
};

const templateDetails: Record<TemplateName, { name: string; eyebrow: string; description: string }> = {
  editorial: {
    name: 'Editorial',
    eyebrow: 'The thoughtful classic',
    description: 'A generous, literary layout with a strong opening and an easy reading rhythm.',
  },
  folio: {
    name: 'Margin',
    eyebrow: 'The quiet specialist',
    description: 'A compact, considered format that lets your work speak with calm authority.',
  },
  signal: {
    name: 'Signal',
    eyebrow: 'The confident modern',
    description: 'A clear hierarchy and crisp details for roles where clarity is a superpower.',
  },
};

const sampleResume: ResumeInput = {
  basics: {
    name: 'Mara Chen',
    headline: 'Product designer shaping useful, human software',
    email: 'mara.chen@email.com',
    phone: '+1 415 555 0188',
    location: 'San Francisco, CA',
    summary:
      'Product designer with 7 years of experience turning complex systems into clear, trusted tools. I work across research, interaction, and visual design to help teams make meaningful things feel inevitable.',
    website: 'marachen.design',
  },
  experience: [
    {
      id: 'experience-1',
      role: 'Senior Product Designer',
      company: 'Northstar Health',
      location: 'San Francisco, CA',
      startDate: '2021',
      endDate: 'Present',
      description:
        'Led the redesign of a care coordination platform used by 12,000+ clinicians. Partnered with product and engineering to reduce task time by 34% and establish a scalable design system.',
    },
    {
      id: 'experience-2',
      role: 'Product Designer',
      company: 'Kindred Studio',
      location: 'Oakland, CA',
      startDate: '2018',
      endDate: '2021',
      description:
        'Designed digital products for mission-driven teams, from early product strategy through launch. Built research practice and mentored two emerging designers.',
    },
  ],
  education: [
    {
      id: 'education-1',
      school: 'California College of the Arts',
      degree: 'BFA, Interaction Design',
      location: 'San Francisco, CA',
      startDate: '2014',
      endDate: '2018',
    },
  ],
  skills: [
    { id: 'skill-1', name: 'Product strategy', level: 'expert' },
    { id: 'skill-2', name: 'Interaction design', level: 'expert' },
    { id: 'skill-3', name: 'Design systems', level: 'advanced' },
    { id: 'skill-4', name: 'User research', level: 'advanced' },
  ],
  projects: [
    {
      id: 'project-1',
      name: 'Care notes',
      description: 'A calmer way for care teams to share context across a patient journey.',
      link: 'marachen.design/care-notes',
      technologies: ['Figma', 'Prototyping'],
    },
  ],
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function App() {
  const [template, setTemplate] = useState<TemplateName>(() => (localStorage.getItem('resumeflow-template') as TemplateName) || 'editorial');
  const [accent, setAccent] = useState<AccentName>(() => (localStorage.getItem('resumeflow-accent') as AccentName) || 'teal');
  const [isDark, setIsDark] = useState(() => localStorage.getItem('resumeflow-night-reading') === 'true');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('resumeflow-night-reading', String(isDark));
  }, [isDark]);
  useEffect(() => {
    localStorage.setItem('resumeflow-template', template);
  }, [template]);
  useEffect(() => {
    localStorage.setItem('resumeflow-accent', accent);
  }, [accent]);

  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes template={template} accent={accent} setTemplate={setTemplate} setAccent={setAccent} isDark={isDark} setIsDark={setIsDark} />
    </WouterRouter>
  );
}

function ClerkProviderWithRoutes({
  template,
  accent,
  setTemplate,
  setAccent,
  isDark,
  setIsDark,
}: {
  template: TemplateName;
  accent: AccentName;
  setTemplate: (value: TemplateName) => void;
  setAccent: (value: AccentName) => void;
  isDark: boolean;
  setIsDark: (value: boolean) => void;
}) {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'Welcome back', subtitle: 'Your next chapter is waiting.' } },
        signUp: { start: { title: 'Create your ResumeFlow', subtitle: 'Keep your work ready wherever you go.' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <RoutedErrorBoundary>
            <Switch>
              <Route path="/"><HomeRedirect /></Route>
              <Route path="/sign-in/*?"><AuthPage type="sign-in" /></Route>
              <Route path="/sign-up/*?"><AuthPage type="sign-up" /></Route>
              <Route path="/builder"><Protected><Builder template={template} accent={accent} setTemplate={setTemplate} setAccent={setAccent} /></Protected></Route>
              <Route path="/templates"><Protected><Templates template={template} setTemplate={setTemplate} accent={accent} setAccent={setAccent} /></Protected></Route>
              <Route path="/settings"><Protected><Settings isDark={isDark} setIsDark={setIsDark} /></Protected></Route>
              <Route component={NotFound} />
            </Switch>
          </RoutedErrorBoundary>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== userId) client.clear();
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <AuthLoading />;
  if (isSignedIn) return <Redirect to="/builder" />;
  return <Welcome />;
}

function AuthPage({ type }: { type: 'sign-in' | 'sign-up' }) {
  return (
    <main className="grain grid min-h-[100dvh] place-items-center bg-[hsl(var(--background))] px-4 py-10">
      <div className="w-full max-w-[470px]">
        <div className="mb-7 text-center">
          <Brand />
          <p className="mx-auto mt-4 max-w-[310px] text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            {type === 'sign-in' ? 'A calm place to keep your best work ready.' : 'Create a private workspace for the career story you want to tell.'}
          </p>
        </div>
        {type === 'sign-in' ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /> : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />}
      </div>
    </main>
  );
}

function Protected({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <AuthLoading />;
  if (!isSignedIn) return <RedirectToSignIn />;
  return <>{children}</>;
}

function AuthLoading() {
  return <main className="grain grid min-h-[100dvh] place-items-center"><div className="text-center"><Brand /><LoaderCircle className="mx-auto mt-8 animate-spin text-[hsl(var(--primary))]" size={22} /><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Opening your private workspace…</p></div></main>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
      <span className="grid size-9 place-items-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm">
        <PencilLine size={17} strokeWidth={2.2} />
      </span>
      <span className="font-display text-[25px] leading-none tracking-tight">resumeflow</span>
    </Link>
  );
}

function MarketingNav({ active }: { active?: string }) {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-[1240px] items-center justify-between px-6 py-6 lg:px-10">
      <Brand />
      <nav className="hidden items-center gap-1 md:flex">
        <Link href="/templates" className={`rounded-full px-4 py-2 text-sm font-medium transition hover:bg-[hsl(var(--secondary))] ${active === 'templates' ? 'bg-[hsl(var(--secondary))]' : ''}`} data-testid="link-templates">Templates</Link>
        <Link href="/settings" className={`rounded-full px-4 py-2 text-sm font-medium transition hover:bg-[hsl(var(--secondary))] ${active === 'settings' ? 'bg-[hsl(var(--secondary))]' : ''}`} data-testid="link-settings">Preferences</Link>
      </nav>
      <div className="flex items-center gap-2">
        <Show when="signed-out"><Link href="/sign-in" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--foreground))] sm:block">Sign in</Link><Link href="/sign-up" className="group flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-bold text-[hsl(var(--primary-foreground))] shadow-sm transition hover:-translate-y-0.5" data-testid="link-nav-sign-up">Create account <ArrowRight size={15} /></Link></Show>
        <Show when="signed-in"><Link href="/builder" className="group flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/.72)] px-4 py-2 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:border-[hsl(var(--primary)/.4)]" data-testid="link-nav-builder">Open workspace <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></Link></Show>
      </div>
    </header>
  );
}

function Welcome() {
  return (
    <main className="grain min-h-[100dvh] overflow-hidden">
      <MarketingNav />
      <section className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-6 pb-20 pt-10 lg:grid-cols-[1.04fr_.96fr] lg:px-10 lg:pb-28 lg:pt-20">
        <div className="relative z-10 max-w-[650px]">
          <div className="rise mb-8 flex items-center gap-3 text-sm font-semibold text-[hsl(var(--primary))]">
            <span className="grid size-7 place-items-center rounded-full bg-[hsl(var(--accent)/.18)]"><Sparkles size={14} /></span>
            Your next chapter, edited well.
          </div>
          <h1 className="rise rise-delay-1 font-display text-[clamp(4rem,8vw,7.7rem)] leading-[.84] tracking-[-.055em] text-[hsl(var(--foreground))]">
            A resume<br /><em className="text-[hsl(var(--primary))]">worth</em> sending.
          </h1>
          <p className="rise rise-delay-2 mt-9 max-w-[510px] text-lg leading-8 text-[hsl(var(--muted-foreground))]">
            ResumeFlow gives your experience a clear point of view. Write with focus, shape the story, and leave with a document that feels unmistakably yours.
          </p>
          <div className="rise rise-delay-3 mt-9 flex flex-wrap items-center gap-4">
            <Link href="/builder" className="group flex items-center gap-3 rounded-full bg-[hsl(var(--primary))] px-6 py-3.5 text-sm font-bold text-[hsl(var(--primary-foreground))] shadow-[0_10px_25px_hsl(var(--primary)/.2)] transition hover:-translate-y-1 hover:shadow-[0_15px_28px_hsl(var(--primary)/.28)]" data-testid="link-start-building">
              Start building <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/templates" className="flex items-center gap-2 rounded-full px-4 py-3.5 text-sm font-semibold text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--foreground))]" data-testid="link-browse-templates">
              Browse templates <ChevronRight size={16} />
            </Link>
          </div>
          <div className="mt-14 flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
            <div className="flex -space-x-2">
              {['MC', 'RA', 'JL'].map((initials) => <span key={initials} className="grid size-8 place-items-center rounded-full border-2 border-[hsl(var(--background))] bg-[hsl(var(--secondary))] text-[10px] font-bold text-[hsl(var(--primary))]">{initials}</span>)}
            </div>
            <span>Made for the work between jobs.</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[520px] lg:justify-self-end">
          <div className="absolute -left-10 top-16 size-28 rounded-full bg-[hsl(var(--accent)/.24)] blur-2xl" />
          <div className="absolute -right-5 bottom-8 size-44 rounded-full bg-[hsl(var(--primary)/.12)] blur-3xl" />
          <div className="relative rotate-[3.5deg] rounded-[26px] border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.58)] p-3 shadow-[0_30px_60px_hsl(191_29%_19%/.16)]">
            <div className="rotate-[-3.5deg] overflow-hidden rounded-[17px] border border-[#e4ddd0] bg-[#fcfaf4] p-7 text-[#2b3b3d] shadow-sm sm:p-10">
              <div className="flex items-start justify-between border-b border-[#d8d0c1] pb-6">
                <div><div className="font-display text-4xl">Mara Chen</div><div className="mt-1 text-[10px] uppercase tracking-[.18em] text-[#247c73]">Product designer</div></div>
                <div className="text-right font-mono text-[8px] leading-4 text-[#78807e]">SAN FRANCISCO<br />mara@email.com</div>
              </div>
              <div className="mt-6 grid grid-cols-[.34fr_1fr] gap-6">
                <div className="space-y-5">
                  <MiniBlock title="Selected skills" lines={['Product strategy', 'Interaction design', 'Research']} />
                  <MiniBlock title="Education" lines={['BFA · CCA', '2014 — 2018']} />
                </div>
                <div>
                  <div className="mb-3 text-[9px] font-bold uppercase tracking-[.15em] text-[#247c73]">Experience</div>
                  <div className="space-y-5">
                    <MiniBlock title="Northstar Health" lines={['Senior Product Designer', '2021 — Present', 'Led the redesign of a care']} />
                    <MiniBlock title="Kindred Studio" lines={['Product Designer', '2018 — 2021', 'Designed digital products']} />
                  </div>
                </div>
              </div>
              <div className="mt-8 h-2 w-2/3 rounded-full bg-[#dbeae5]" /><div className="mt-2 h-2 w-1/2 rounded-full bg-[#ebe5d9]" />
            </div>
          </div>
          <div className="absolute -bottom-5 -left-6 flex items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 shadow-[0_14px_30px_hsl(191_29%_19%/.1)]">
            <span className="grid size-8 place-items-center rounded-full bg-[hsl(var(--accent)/.2)] text-[hsl(var(--accent))]"><Check size={16} strokeWidth={3} /></span>
            <div><div className="text-xs font-bold">Your story, clearer</div><div className="mt-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">Ready when you are</div></div>
          </div>
        </div>
      </section>
      <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.35)]">
        <div className="mx-auto grid max-w-[1240px] gap-7 px-6 py-14 md:grid-cols-3 lg:px-10">
          <ValueStep number="01" title="Bring the raw material" copy="Start with what you have. ResumeFlow gives every detail a considered place." />
          <ValueStep number="02" title="Find your throughline" copy="Edit in one calm workspace while the finished page takes shape beside you." />
          <ValueStep number="03" title="Send it with ease" copy="Choose your voice, save a polished PDF, and make a good first impression." />
        </div>
      </section>
      <footer className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-8 text-xs text-[hsl(var(--muted-foreground))] lg:px-10">
        <Brand /><span>Thoughtful tools for meaningful work.</span>
      </footer>
    </main>
  );
}

function MiniBlock({ title, lines }: { title: string; lines: string[] }) {
  return <div><div className="mb-2 text-[8px] font-bold uppercase tracking-[.16em] text-[#247c73]">{title}</div>{lines.map((line, index) => <div key={`${line}-${index}`} className={`text-[9px] leading-4 ${index === 0 ? 'font-semibold' : 'text-[#78807e]'}`}>{line}</div>)}</div>;
}

function ValueStep({ number, title, copy }: { number: string; title: string; copy: string }) {
  return <div className="flex gap-4"><span className="font-mono-ui text-xs text-[hsl(var(--accent))]">{number}</span><div><h2 className="font-display text-2xl">{title}</h2><p className="mt-2 max-w-[290px] text-sm leading-6 text-[hsl(var(--muted-foreground))]">{copy}</p></div></div>;
}

function AppShell({ children, active, onMenu }: { children: ReactNode; active: string; onMenu?: () => void }) {
  return (
    <div className="grain min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.9)] px-5 py-4 backdrop-blur-md lg:px-8">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <div className="flex items-center gap-4"><button className="rounded-lg p-2 lg:hidden" onClick={onMenu} aria-label="Open navigation" data-testid="button-open-menu"><Menu size={20} /></button><Brand /></div>
          <nav className="hidden items-center gap-1 md:flex">
            <ShellLink href="/builder" label="Workspace" icon={<FileText size={15} />} active={active === 'builder'} />
            <ShellLink href="/templates" label="Templates" icon={<LayoutTemplate size={15} />} active={active === 'templates'} />
            <ShellLink href="/settings" label="Preferences" icon={<SettingsIcon size={15} />} active={active === 'settings'} />
          </nav>
          <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]"><span className="hidden items-center gap-1.5 sm:flex"><LockKeyhole size={13} /> Private workspace</span><UserProfileMenu /></div>
        </div>
      </header>
      {children}
    </div>
  );
}

function UserProfileMenu() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  if (!isLoaded || !user) return <span className="grid size-8 place-items-center rounded-full bg-[hsl(var(--secondary))]"><LoaderCircle size={14} className="animate-spin" /></span>;
  const name = user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress || 'ResumeFlow member';
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  return <div className="relative"><button onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 rounded-full border border-transparent p-1 transition hover:border-[hsl(var(--border))] hover:bg-[hsl(var(--card))]" aria-expanded={open} data-testid="button-account-menu"><span className="grid size-8 place-items-center rounded-full bg-[hsl(var(--secondary))] text-xs font-bold text-[hsl(var(--primary))]">{user.imageUrl ? <img src={user.imageUrl} alt="" className="size-8 rounded-full object-cover" /> : initials}</span><ChevronDown size={13} className="hidden sm:block" /></button>{open && <div className="absolute right-0 top-12 z-40 w-64 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-[0_16px_35px_hsl(191_29%_19%/.16)]"><div className="rounded-xl bg-[hsl(var(--secondary)/.55)] px-3 py-3"><p className="truncate text-sm font-bold">{name}</p><p className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">{user.primaryEmailAddress?.emailAddress}</p></div><button onClick={() => signOut({ redirectUrl: basePath || '/' })} className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--destructive))]" data-testid="button-sign-out"><UserRound size={14} /> Sign out</button></div>}</div>;
}

function ShellLink({ href, label, icon, active }: { href: string; label: string; icon: ReactNode; active: boolean }) {
  return <Link href={href} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${active ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary)/.65)] hover:text-[hsl(var(--foreground))]'}`} data-testid={`link-shell-${label.toLowerCase()}`}>{icon}{label}</Link>;
}

function Builder({ template, accent, setTemplate, setAccent }: { template: TemplateName; accent: AccentName; setTemplate: (value: TemplateName) => void; setAccent: (value: AccentName) => void }) {
  const resumeQuery = useGetResume({ query: { queryKey: getGetResumeQueryKey() } });
  const summaryQuery = useGetResumeSummary({ query: { queryKey: getGetResumeSummaryQueryKey() } });
  const saveResume = useSaveResume();
  const client = useQueryClient();
  const [resume, setResume] = useState<ResumeInput>(sampleResume);
  const [activeSection, setActiveSection] = useState('basics');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (resumeQuery.data?.data && !hydrated) {
      setResume(resumeQuery.data.data);
      setHydrated(true);
    }
  }, [resumeQuery.data, hydrated]);

  const completion = summaryQuery.data?.completion ?? calculateCompletion(resume);
  const updateBasics = (key: keyof ResumeBasics, value: string) => setResume((previous) => ({ ...previous, basics: { ...previous.basics, [key]: value } }));
  const updateExperience = (id: string, patch: Partial<Experience>) => setResume((previous) => ({ ...previous, experience: previous.experience.map((item) => item.id === id ? { ...item, ...patch } : item) }));
  const updateEducation = (id: string, patch: Partial<Education>) => setResume((previous) => ({ ...previous, education: previous.education.map((item) => item.id === id ? { ...item, ...patch } : item) }));
  const updateSkill = (id: string, patch: Partial<Skill>) => setResume((previous) => ({ ...previous, skills: previous.skills.map((item) => item.id === id ? { ...item, ...patch } : item) }));
  const updateProject = (id: string, patch: Partial<Project>) => setResume((previous) => ({ ...previous, projects: previous.projects.map((item) => item.id === id ? { ...item, ...patch } : item) }));

  const save = () => {
    saveResume.mutate({ data: resume }, {
      onSuccess: (result) => {
        setSavedAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
        client.setQueryData(getGetResumeQueryKey(), result);
        client.invalidateQueries({ queryKey: getGetResumeSummaryQueryKey() });
      },
    });
  };

  const addExperience = () => { const id = makeId('experience'); setResume((p) => ({ ...p, experience: [...p.experience, { id, role: '', company: '', location: '', startDate: '', endDate: '', description: '' }] })); setActiveSection('experience'); };
  const addEducation = () => { const id = makeId('education'); setResume((p) => ({ ...p, education: [...p.education, { id, school: '', degree: '', location: '', startDate: '', endDate: '' }] })); setActiveSection('education'); };
  const addSkill = () => { const id = makeId('skill'); setResume((p) => ({ ...p, skills: [...p.skills, { id, name: '', level: 'intermediate' }] })); setActiveSection('skills'); };
  const addProject = () => { const id = makeId('project'); setResume((p) => ({ ...p, projects: [...p.projects, { id, name: '', description: '', link: '', technologies: [] }] })); setActiveSection('projects'); };

  return (
    <AppShell active="builder" onMenu={() => setMobileOpen((value) => !value)}>
      {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}
      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[220px_minmax(400px,1fr)_minmax(430px,1.05fr)]">
        <aside className="hidden min-h-[calc(100dvh-73px)] border-r border-[hsl(var(--border))] px-5 py-8 lg:block">
           <div className="mb-8 px-3"><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--accent))]">My resume</p><h2 className="mt-2 truncate font-display text-2xl">{resume.basics.name || 'Untitled resume'}</h2><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{savedAt ? `Saved ${savedAt}` : 'A draft worth shaping'}</p></div>
          <div className="mb-8 rounded-2xl bg-[hsl(var(--secondary)/.55)] p-4"><div className="flex items-end justify-between"><span className="text-xs font-semibold">Profile strength</span><span className="font-mono-ui text-sm text-[hsl(var(--primary))]">{completion}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--border))]"><div className="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-500" style={{ width: `${completion}%` }} /></div><p className="mt-3 text-[11px] leading-4 text-[hsl(var(--muted-foreground))]">A few thoughtful details go a long way.</p></div>
          <div className="space-y-1"><SideSection icon={<UserRound size={16} />} label="Basics" active={activeSection === 'basics'} onClick={() => setActiveSection('basics')} /><SideSection icon={<BriefcaseBusiness size={16} />} label="Experience" count={resume.experience.length} active={activeSection === 'experience'} onClick={() => setActiveSection('experience')} /><SideSection icon={<GraduationCap size={16} />} label="Education" count={resume.education.length} active={activeSection === 'education'} onClick={() => setActiveSection('education')} /><SideSection icon={<Sparkles size={16} />} label="Skills" count={resume.skills.length} active={activeSection === 'skills'} onClick={() => setActiveSection('skills')} /><SideSection icon={<WandSparkles size={16} />} label="Projects" count={resume.projects.length} active={activeSection === 'projects'} onClick={() => setActiveSection('projects')} /></div>
          <div className="mt-10 border-t border-[hsl(var(--border))] pt-5"><Link href="/templates" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--primary))]" data-testid="link-sidebar-templates"><LayoutTemplate size={15} /> Change template <ChevronRight size={14} className="ml-auto" /></Link><Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--primary))]" data-testid="link-sidebar-settings"><SettingsIcon size={15} /> Preferences <ChevronRight size={14} className="ml-auto" /></Link></div>
        </aside>
        <main className="min-w-0 border-r border-[hsl(var(--border))] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
          <div className="mb-8 flex items-start justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[hsl(var(--accent))]">Working draft</p><h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">Shape your story.</h1><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">The good stuff is already in there. Let’s give it a home.</p></div><div className="hidden items-center gap-2 pt-2 sm:flex">{savedAt && <span className="text-xs text-[hsl(var(--muted-foreground))]" data-testid="status-saved">Saved {savedAt}</span>}<button onClick={save} disabled={saveResume.isPending} className="flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-xs font-bold transition hover:border-[hsl(var(--primary)/.45)] disabled:opacity-60" data-testid="button-save-resume">{saveResume.isPending ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />} {saveResume.isPending ? 'Saving' : 'Save'}</button></div></div>
          {resumeQuery.isLoading && <EditorSkeleton />}
          {resumeQuery.isError && <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[hsl(var(--accent)/.3)] bg-[hsl(var(--accent)/.08)] p-4 text-sm" data-testid="status-resume-error"><CircleHelp size={17} className="text-[hsl(var(--accent))]" /><div><span className="font-semibold">Working offline with a fresh draft.</span><p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">We couldn’t reach your saved resume, but your edits are safe here until you save.</p></div><button onClick={() => resumeQuery.refetch()} className="ml-auto flex items-center gap-1 text-xs font-bold text-[hsl(var(--primary))]" data-testid="button-retry-resume"><RefreshCw size={13} /> Retry</button></div>}
           {saveResume.isError && <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[hsl(var(--destructive)/.25)] bg-[hsl(var(--destructive)/.06)] p-4 text-sm" data-testid="status-save-error"><CircleHelp size={17} className="text-[hsl(var(--destructive))]" /><div><span className="font-semibold">That save did not land.</span><p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">Your draft is still here. Check your connection and try again.</p></div><button onClick={save} className="ml-auto flex items-center gap-1 text-xs font-bold text-[hsl(var(--primary))]" data-testid="button-retry-save"><RefreshCw size={13} /> Try again</button></div>}
          <div className="space-y-3">
            <EditorSection id="basics" title="Basics" caption="The first hello" icon={<UserRound size={17} />} active={activeSection} setActive={setActiveSection}><BasicsForm basics={resume.basics} update={updateBasics} /></EditorSection>
            <EditorSection id="experience" title="Experience" caption="Where you made things happen" icon={<BriefcaseBusiness size={17} />} active={activeSection} setActive={setActiveSection} action={<AddButton onClick={addExperience} label="Add role" testId="button-add-experience" />}><ExperienceForm items={resume.experience} update={updateExperience} remove={(id) => setResume((p) => ({ ...p, experience: p.experience.filter((item) => item.id !== id) }))} /></EditorSection>
            <EditorSection id="education" title="Education" caption="The foundations" icon={<GraduationCap size={17} />} active={activeSection} setActive={setActiveSection} action={<AddButton onClick={addEducation} label="Add school" testId="button-add-education" />}><EducationForm items={resume.education} update={updateEducation} remove={(id) => setResume((p) => ({ ...p, education: p.education.filter((item) => item.id !== id) }))} /></EditorSection>
            <EditorSection id="skills" title="Skills" caption="What you bring to the room" icon={<Sparkles size={17} />} active={activeSection} setActive={setActiveSection} action={<AddButton onClick={addSkill} label="Add skill" testId="button-add-skill" />}><SkillsForm items={resume.skills} update={updateSkill} remove={(id) => setResume((p) => ({ ...p, skills: p.skills.filter((item) => item.id !== id) }))} /></EditorSection>
            <EditorSection id="projects" title="Projects" caption="The work that stays with you" icon={<WandSparkles size={17} />} active={activeSection} setActive={setActiveSection} action={<AddButton onClick={addProject} label="Add project" testId="button-add-project" />}><ProjectsForm items={resume.projects} update={updateProject} remove={(id) => setResume((p) => ({ ...p, projects: p.projects.filter((item) => item.id !== id) }))} /></EditorSection>
          </div>
          <div className="mt-7 flex items-center justify-between sm:hidden"><span className="text-xs text-[hsl(var(--muted-foreground))]">{savedAt ? `Saved ${savedAt}` : 'Changes are saved when you choose Save'}</span><button onClick={save} disabled={saveResume.isPending} className="flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-4 py-2.5 text-xs font-bold text-[hsl(var(--primary-foreground))]" data-testid="button-save-resume-mobile"><Save size={14} /> Save</button></div>
        </main>
        <aside className="min-w-0 bg-[hsl(var(--secondary)/.28)] px-5 py-7 sm:px-8 lg:sticky lg:top-[73px] lg:h-[calc(100dvh-73px)] lg:overflow-auto lg:px-8 lg:py-9">
          <div className="mb-5 flex items-center justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[hsl(var(--accent))]">Live preview</p><h2 className="mt-1 font-display text-2xl">Your finished page</h2></div><div className="flex items-center gap-1"><button onClick={() => window.print()} className="grid size-9 place-items-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--primary))]" title="Print resume" data-testid="button-print-resume"><Printer size={15} /></button><button onClick={() => window.print()} className="grid size-9 place-items-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--primary))]" title="Download as PDF" data-testid="button-download-resume"><Download size={15} /></button><button onClick={save} className="grid size-9 place-items-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--primary))]" title="Save resume" data-testid="button-save-preview"><Save size={15} /></button></div></div>
          <div className="mb-5 flex flex-wrap gap-2"><Link href="/templates" className="flex items-center gap-2 rounded-full bg-[hsl(var(--card))] px-3 py-2 text-xs font-semibold shadow-sm transition hover:text-[hsl(var(--primary))]" data-testid="link-preview-template"><LayoutTemplate size={13} /> {templateDetails[template].name}</Link><AccentPicker accent={accent} setAccent={setAccent} /></div>
          <ResumePreview resume={resume} template={template} accent={accent} />
          <div className="mt-5 flex items-start gap-2 text-[11px] leading-5 text-[hsl(var(--muted-foreground))]"><LockKeyhole size={13} className="mt-0.5 shrink-0 text-[hsl(var(--primary))]" /> Private by default. Your resume is only visible to you.</div>
        </aside>
      </div>
    </AppShell>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-40 bg-[hsl(var(--foreground)/.22)] lg:hidden" onClick={onClose}><aside className="h-full w-[280px] bg-[hsl(var(--sidebar))] p-6 text-[hsl(var(--sidebar-foreground))]" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><Brand /><button onClick={onClose} className="rounded-lg p-2 text-[hsl(var(--sidebar-foreground))]" data-testid="button-close-menu"><X size={18} /></button></div><nav className="mt-12 space-y-2"><Link href="/builder" onClick={onClose} className="flex items-center gap-3 rounded-xl bg-[hsl(var(--sidebar-accent))] px-4 py-3 text-sm font-semibold" data-testid="link-mobile-builder"><FileText size={16} /> Workspace</Link><Link href="/templates" onClick={onClose} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold" data-testid="link-mobile-templates"><LayoutTemplate size={16} /> Templates</Link><Link href="/settings" onClick={onClose} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold" data-testid="link-mobile-settings"><SettingsIcon size={16} /> Preferences</Link></nav></aside></div>;
}

function SideSection({ icon, label, count, active, onClick }: { icon: ReactNode; label: string; count?: number; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary)/.55)] hover:text-[hsl(var(--foreground))]'}`} data-testid={`button-section-${label.toLowerCase()}`}>{icon}<span>{label}</span>{count !== undefined && <span className="ml-auto font-mono-ui text-[10px] opacity-65">{count}</span>}</button>;
}

function EditorSkeleton() {
  return <div className="mb-4 animate-pulse space-y-3" data-testid="status-editor-loading"><div className="h-20 rounded-2xl bg-[hsl(var(--muted))]" /><div className="h-16 rounded-2xl bg-[hsl(var(--muted))]" /></div>;
}

function EditorSection({ id, title, caption, icon, active, setActive, action, children }: { id: string; title: string; caption: string; icon: ReactNode; active: string; setActive: (id: string) => void; action?: ReactNode; children: ReactNode }) {
  const isOpen = active === id;
  return <section className={`overflow-hidden rounded-2xl border bg-[hsl(var(--card))] transition-shadow ${isOpen ? 'border-[hsl(var(--primary)/.28)] shadow-[0_8px_22px_hsl(191_29%_19%/.05)]' : 'border-[hsl(var(--card-border))]'}`}><div className="flex items-center gap-3 px-4 py-4 sm:px-5"><button onClick={() => setActive(isOpen ? '' : id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" data-testid={`button-toggle-section-${id}`}><span className={`grid size-9 shrink-0 place-items-center rounded-xl transition ${isOpen ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]'}`}>{icon}</span><span className="min-w-0"><span className="block text-sm font-bold">{title}</span><span className="mt-0.5 block truncate text-xs text-[hsl(var(--muted-foreground))]">{caption}</span></span></button>{action}<button onClick={() => setActive(isOpen ? '' : id)} className="grid size-8 shrink-0 place-items-center rounded-full text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--secondary))]" data-testid={`button-chevron-section-${id}`}><ChevronDown size={17} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button></div>{isOpen && <div className="border-t border-[hsl(var(--border))] px-4 pb-5 pt-5 sm:px-5">{children}</div>}</section>;
}

function AddButton({ onClick, label, testId }: { onClick: () => void; label: string; testId: string }) {
  return <button onClick={onClick} className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--secondary))]" data-testid={testId}><Plus size={14} /> {label}</button>;
}

function Field({ label, value, onChange, placeholder, multiline = false, type = 'text', testId }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean; type?: string; testId: string }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.09em] text-[hsl(var(--muted-foreground))]">{label}</span>{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} className="w-full resize-y rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background)/.5)] px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-[hsl(var(--muted-foreground)/.6)] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/.13)]" data-testid={testId} /> : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background)/.5)] px-3.5 py-3 text-sm outline-none transition placeholder:text-[hsl(var(--muted-foreground)/.6)] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/.13)]" data-testid={testId} />}</label>;
}

function BasicsForm({ basics, update }: { basics: ResumeBasics; update: (key: keyof ResumeBasics, value: string) => void }) {
  return <div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Name" value={basics.name} onChange={(value) => update('name', value)} placeholder="Your name" testId="input-basics-name" /></div><div className="sm:col-span-2"><Field label="Headline" value={basics.headline} onChange={(value) => update('headline', value)} placeholder="The work you want to be known for" testId="input-basics-headline" /></div><Field label="Email" type="email" value={basics.email} onChange={(value) => update('email', value)} placeholder="you@example.com" testId="input-basics-email" /><Field label="Phone" value={basics.phone} onChange={(value) => update('phone', value)} placeholder="+1 000 000 0000" testId="input-basics-phone" /><Field label="Location" value={basics.location} onChange={(value) => update('location', value)} placeholder="City, Country" testId="input-basics-location" /><Field label="Website" value={basics.website} onChange={(value) => update('website', value)} placeholder="yoursite.com" testId="input-basics-website" /><div className="sm:col-span-2"><Field label="Summary" multiline value={basics.summary} onChange={(value) => update('summary', value)} placeholder="A few lines that make someone want to keep reading…" testId="input-basics-summary" /></div></div>;
}

function ExperienceForm({ items, update, remove }: { items: Experience[]; update: (id: string, patch: Partial<Experience>) => void; remove: (id: string) => void }) {
  if (!items.length) return <EmptySection icon={<BriefcaseBusiness size={20} />} title="No roles yet" copy="Add the work that shaped how you think and make." />;
  return <div className="space-y-6">{items.map((item, index) => <div key={item.id} className="relative border-b border-[hsl(var(--border))] pb-6 last:border-0 last:pb-0"><div className="mb-4 flex items-center justify-between"><span className="font-mono-ui text-[10px] text-[hsl(var(--accent))]">0{index + 1} / ROLE</span><button onClick={() => remove(item.id)} className="flex items-center gap-1 text-[11px] font-semibold text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--destructive))]" data-testid={`button-remove-experience-${item.id}`}><Trash2 size={13} /> Remove</button></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Role" value={item.role} onChange={(value) => update(item.id, { role: value })} placeholder="Senior Product Designer" testId={`input-experience-role-${item.id}`} /><Field label="Company" value={item.company} onChange={(value) => update(item.id, { company: value })} placeholder="Company name" testId={`input-experience-company-${item.id}`} /><Field label="Location" value={item.location} onChange={(value) => update(item.id, { location: value })} placeholder="City, Country" testId={`input-experience-location-${item.id}`} /><div className="grid grid-cols-2 gap-3"><Field label="Start" value={item.startDate} onChange={(value) => update(item.id, { startDate: value })} placeholder="2021" testId={`input-experience-start-${item.id}`} /><Field label="End" value={item.endDate} onChange={(value) => update(item.id, { endDate: value })} placeholder="Present" testId={`input-experience-end-${item.id}`} /></div><div className="sm:col-span-2"><Field label="What changed because of you?" multiline value={item.description} onChange={(value) => update(item.id, { description: value })} placeholder="Describe your contribution, impact, and the work you’re proud of." testId={`input-experience-description-${item.id}`} /></div></div></div>)}</div>;
}

function EducationForm({ items, update, remove }: { items: Education[]; update: (id: string, patch: Partial<Education>) => void; remove: (id: string) => void }) {
  if (!items.length) return <EmptySection icon={<GraduationCap size={20} />} title="No education yet" copy="Add the places, people, or practices that taught you." />;
  return <div className="space-y-6">{items.map((item, index) => <div key={item.id} className="relative border-b border-[hsl(var(--border))] pb-6 last:border-0 last:pb-0"><div className="mb-4 flex items-center justify-between"><span className="font-mono-ui text-[10px] text-[hsl(var(--accent))]">0{index + 1} / FOUNDATION</span><button onClick={() => remove(item.id)} className="flex items-center gap-1 text-[11px] font-semibold text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--destructive))]" data-testid={`button-remove-education-${item.id}`}><Trash2 size={13} /> Remove</button></div><div className="grid gap-4 sm:grid-cols-2"><Field label="School or program" value={item.school} onChange={(value) => update(item.id, { school: value })} placeholder="School, program, or mentor" testId={`input-education-school-${item.id}`} /><Field label="Degree or focus" value={item.degree} onChange={(value) => update(item.id, { degree: value })} placeholder="BFA, Interaction Design" testId={`input-education-degree-${item.id}`} /><Field label="Location" value={item.location} onChange={(value) => update(item.id, { location: value })} placeholder="City, Country" testId={`input-education-location-${item.id}`} /><div className="grid grid-cols-2 gap-3"><Field label="Start" value={item.startDate} onChange={(value) => update(item.id, { startDate: value })} placeholder="2014" testId={`input-education-start-${item.id}`} /><Field label="End" value={item.endDate} onChange={(value) => update(item.id, { endDate: value })} placeholder="2018" testId={`input-education-end-${item.id}`} /></div></div></div>)}</div>;
}

function SkillsForm({ items, update, remove }: { items: Skill[]; update: (id: string, patch: Partial<Skill>) => void; remove: (id: string) => void }) {
  if (!items.length) return <EmptySection icon={<Sparkles size={20} />} title="Make your strengths visible" copy="A short, honest list is more useful than a wall of keywords." />;
  return <div className="space-y-3">{items.map((item) => <div key={item.id} className="flex items-end gap-3"><div className="flex-1"><Field label="Skill" value={item.name} onChange={(value) => update(item.id, { name: value })} placeholder="A skill you use often" testId={`input-skill-name-${item.id}`} /></div><label className="w-[145px]"><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[.09em] text-[hsl(var(--muted-foreground))]">Level</span><select value={item.level} onChange={(event) => update(item.id, { level: event.target.value as Skill['level'] })} className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background)/.5)] px-3 py-3 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid={`select-skill-level-${item.id}`}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option></select></label><button onClick={() => remove(item.id)} className="mb-1 grid size-10 shrink-0 place-items-center rounded-xl text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--accent)/.1)] hover:text-[hsl(var(--destructive))]" data-testid={`button-remove-skill-${item.id}`}><Trash2 size={15} /></button></div>)}</div>;
}

function ProjectsForm({ items, update, remove }: { items: Project[]; update: (id: string, patch: Partial<Project>) => void; remove: (id: string) => void }) {
  if (!items.length) return <EmptySection icon={<WandSparkles size={20} />} title="Give your side work a stage" copy="Projects reveal curiosity, range, and the way you turn ideas into something real." />;
  return <div className="space-y-6">{items.map((item, index) => <div key={item.id} className="border-b border-[hsl(var(--border))] pb-6 last:border-0 last:pb-0"><div className="mb-4 flex items-center justify-between"><span className="font-mono-ui text-[10px] text-[hsl(var(--accent))]">0{index + 1} / PROJECT</span><button onClick={() => remove(item.id)} className="flex items-center gap-1 text-[11px] font-semibold text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--destructive))]" data-testid={`button-remove-project-${item.id}`}><Trash2 size={13} /> Remove</button></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Project name" value={item.name} onChange={(value) => update(item.id, { name: value })} placeholder="A project worth remembering" testId={`input-project-name-${item.id}`} /><Field label="Link" value={item.link} onChange={(value) => update(item.id, { link: value })} placeholder="yoursite.com/project" testId={`input-project-link-${item.id}`} /><div className="sm:col-span-2"><Field label="The short version" multiline value={item.description} onChange={(value) => update(item.id, { description: value })} placeholder="What did you make, and why did it matter?" testId={`input-project-description-${item.id}`} /></div><Field label="Tools or technologies" value={item.technologies.join(', ')} onChange={(value) => update(item.id, { technologies: value.split(',').map((technology) => technology.trim()).filter(Boolean) })} placeholder="Figma, React, Notion" testId={`input-project-technologies-${item.id}`} /></div></div>)}</div>;
}

function EmptySection({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return <div className="flex items-center gap-4 rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.28)] p-5" data-testid="empty-editor-section"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[hsl(var(--card))] text-[hsl(var(--primary))]">{icon}</span><div><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{copy}</p></div></div>;
}

function AccentPicker({ accent, setAccent }: { accent: AccentName; setAccent: (value: AccentName) => void }) {
  const [open, setOpen] = useState(false);
  return <div className="relative"><button onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 rounded-full bg-[hsl(var(--card))] px-3 py-2 text-xs font-semibold shadow-sm" data-testid="button-open-accent-picker"><Palette size={13} style={{ color: accents[accent].value }} /> {accents[accent].label} <ChevronDown size={12} /></button>{open && <div className="absolute right-0 top-11 z-10 w-44 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-[0_14px_35px_hsl(191_29%_19%/.16)]">{(Object.keys(accents) as AccentName[]).map((key) => <button key={key} onClick={() => { setAccent(key); setOpen(false); }} className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold transition hover:bg-[hsl(var(--secondary))] ${accent === key ? 'bg-[hsl(var(--secondary))]' : ''}`} data-testid={`button-accent-${key}`}><span className="size-3 rounded-full" style={{ backgroundColor: accents[key].value }} />{accents[key].label}{accent === key && <Check size={13} className="ml-auto text-[hsl(var(--primary))]" />}</button>)}</div>}</div>;
}

function ResumePreview({ resume, template, accent }: { resume: ResumeInput; template: TemplateName; accent: AccentName }) {
  const { basics, experience, education, skills, projects } = resume;
  return <article id="resume-print" className={`resume-paper preview-scale mx-auto min-h-[720px] w-full max-w-[680px] overflow-hidden border border-[#e5ded0] p-7 text-[10px] shadow-[0_16px_35px_hsl(191_29%_19%/.12)] sm:p-10 ${template === 'folio' ? 'font-sans' : ''}`} style={{ '--resume-accent': accents[accent].value } as React.CSSProperties} data-testid="resume-live-preview">
    {template === 'signal' && <div className="absolute left-0 top-0 h-2 w-full resume-accent-bg" />}
    <div className={template === 'folio' ? 'border-l-2 pl-6 resume-rule' : ''}>
      <header className={`border-b pb-6 ${template === 'signal' ? 'pt-3' : ''} resume-rule`}>
        <h1 className={`${template === 'signal' ? 'font-sans text-4xl font-bold tracking-tight' : 'font-display text-5xl'} resume-accent`}>{basics.name || 'Your name'}</h1>
        <p className="mt-2 max-w-[470px] text-[12px] font-semibold text-[#536362]">{basics.headline || 'Your professional headline'}</p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[8px] text-[#73807d]"><span>{basics.email || 'email@example.com'}</span><span>{basics.phone || 'phone'}</span><span>{basics.location || 'City, Country'}</span>{basics.website && <span>{basics.website}</span>}</div>
      </header>
      {basics.summary && <PreviewSection title="Profile" accent={accent}><p className="max-w-[570px] leading-5 text-[#536362]">{basics.summary}</p></PreviewSection>}
      {experience.length > 0 && <PreviewSection title="Experience" accent={accent}>{experience.map((item) => <div key={item.id} className="mb-5 last:mb-0"><div className="flex items-baseline justify-between gap-3"><h3 className="text-[12px] font-bold">{item.role || 'Role'}</h3><span className="shrink-0 font-mono text-[8px] text-[#73807d]">{item.startDate || 'Start'} — {item.endDate || 'End'}</span></div><div className="mt-1 flex justify-between gap-3 text-[9px] font-semibold resume-accent"><span>{item.company || 'Company'}</span><span className="font-normal text-[#73807d]">{item.location}</span></div>{item.description && <p className="mt-2 leading-5 text-[#536362]">{item.description}</p>}</div>)}</PreviewSection>}
      <div className="grid gap-x-8 sm:grid-cols-[1fr_.72fr]">{education.length > 0 && <PreviewSection title="Education" accent={accent}>{education.map((item) => <div key={item.id} className="mb-3 last:mb-0"><h3 className="text-[11px] font-bold">{item.school || 'School'}</h3><p className="mt-1 text-[9px] resume-accent">{item.degree || 'Degree or focus'}</p><p className="mt-1 font-mono text-[8px] text-[#73807d]">{item.startDate} — {item.endDate}</p></div>)}</PreviewSection>}{skills.length > 0 && <PreviewSection title="Skills" accent={accent}><div className="flex flex-wrap gap-1.5">{skills.map((item) => <span key={item.id} className="rounded-full px-2 py-1 text-[8px] font-semibold" style={{ background: accents[accent].soft, color: accents[accent].value }}>{item.name || 'Skill'}</span>)}</div></PreviewSection>}</div>
      {projects.length > 0 && <PreviewSection title="Selected projects" accent={accent}>{projects.map((item) => <div key={item.id} className="mb-3 last:mb-0"><div className="flex items-baseline justify-between gap-3"><h3 className="text-[11px] font-bold">{item.name || 'Project name'}</h3>{item.link && <span className="font-mono text-[8px] resume-accent">{item.link}</span>}</div>{item.description && <p className="mt-1 leading-5 text-[#536362]">{item.description}</p>}</div>)}</PreviewSection>}
    </div>
  </article>;
}

function PreviewSection({ title, accent, children }: { title: string; accent: AccentName; children: ReactNode }) {
  return <section className="mt-6"><h2 className="mb-3 text-[9px] font-bold uppercase tracking-[.19em]" style={{ color: accents[accent].value }}>{title}</h2>{children}</section>;
}

function calculateCompletion(resume: ResumeInput) {
  const checks = [resume.basics.name, resume.basics.headline, resume.basics.email, resume.basics.summary, resume.experience.length, resume.education.length, resume.skills.length, resume.projects.length];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function Templates({ template, setTemplate, accent, setAccent }: { template: TemplateName; setTemplate: (value: TemplateName) => void; accent: AccentName; setAccent: (value: AccentName) => void }) {
  const [, setLocation] = useLocation();
  return <AppShell active="templates"><main className="mx-auto max-w-[1240px] px-6 py-12 lg:px-10 lg:py-16"><div className="max-w-[700px]"><p className="font-mono-ui text-[10px] uppercase tracking-[.17em] text-[hsl(var(--accent))]">The gallery</p><h1 className="mt-3 font-display text-6xl leading-[.9] tracking-tight sm:text-7xl">Choose a point<br /><em className="text-[hsl(var(--primary))]">of view.</em></h1><p className="mt-6 text-base leading-7 text-[hsl(var(--muted-foreground))]">A template should feel like a good editor: present, useful, and never louder than your work. Pick the rhythm that feels like you.</p></div><div className="mt-12 grid gap-6 md:grid-cols-3">{(Object.keys(templateDetails) as TemplateName[]).map((key, index) => <TemplateCard key={key} name={key} index={index} selected={template === key} onSelect={() => { setTemplate(key); setLocation('/builder'); }} accent={accent} />)}</div><div className="mt-14 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/.4)] p-5 sm:p-6"><div><p className="text-sm font-bold">Make it yours</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Every template works with every accent. Your content stays at the center.</p></div><div className="flex flex-wrap gap-2">{(Object.keys(accents) as AccentName[]).map((key) => <button key={key} onClick={() => setAccent(key)} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${accent === key ? 'border-[hsl(var(--primary)/.35)] bg-[hsl(var(--card))]' : 'border-transparent'}`} data-testid={`button-gallery-accent-${key}`}><span className="size-3 rounded-full" style={{ backgroundColor: accents[key].value }} />{accents[key].label}{accent === key && <Check size={13} className="text-[hsl(var(--primary))]" />}</button>)}</div></div></main></AppShell>;
}

function TemplateCard({ name, index, selected, onSelect, accent }: { name: TemplateName; index: number; selected: boolean; onSelect: () => void; accent: AccentName }) {
  const accentValue = accents[accent].value;
  const mock = <div className={`relative h-[295px] overflow-hidden rounded-t-[13px] bg-[#fcfaf4] p-5 text-[#2b3b3d] ${name === 'folio' ? 'border-l-[5px]' : ''}`} style={{ borderColor: name === 'folio' ? accentValue : undefined }}><div className={`border-b pb-4 ${name === 'signal' ? 'border-t-4 pt-2' : ''}`} style={{ borderColor: accentValue }}><div className={`${name === 'signal' ? 'font-sans text-xl font-bold' : 'font-display text-3xl'}`}>Mara Chen</div><div className="mt-1 text-[7px] uppercase tracking-[.18em]" style={{ color: accentValue }}>Product designer</div></div><div className="mt-4 grid grid-cols-[.36fr_1fr] gap-4"><div className="space-y-4"><MiniBlock title="Skills" lines={['Product strategy', 'Research', 'Systems']} /><MiniBlock title="Education" lines={['BFA · CCA']} /></div><div><MiniBlock title="Experience" lines={['Senior Product Designer', 'Northstar Health', '2021 — Present', 'Led the redesign of a']} /><div className="mt-4"><MiniBlock title="Projects" lines={['Care notes', 'A calmer way to share']} /></div></div></div></div>;
  return <button onClick={onSelect} className={`group overflow-hidden rounded-[18px] border text-left transition duration-300 hover:-translate-y-1 ${selected ? 'border-[hsl(var(--primary))] shadow-[0_18px_35px_hsl(var(--primary)/.15)]' : 'border-[hsl(var(--border))] shadow-[0_10px_25px_hsl(191_29%_19%/.06)] hover:border-[hsl(var(--primary)/.35)]'}`} data-testid={`button-template-${name}`}><div className="relative bg-[hsl(var(--secondary)/.62)] p-3">{mock}<span className="absolute right-5 top-5 grid size-8 place-items-center rounded-full bg-[hsl(var(--card))] text-[hsl(var(--primary))] shadow-sm opacity-0 transition group-hover:opacity-100">{selected ? <Check size={15} /> : <ArrowRight size={15} />}</span></div><div className="flex items-start justify-between gap-3 bg-[hsl(var(--card))] p-5"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-[hsl(var(--accent))]">0{index + 1} / {templateDetails[name].eyebrow}</p><h2 className="mt-2 font-display text-3xl">{templateDetails[name].name}</h2><p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{templateDetails[name].description}</p></div>{selected && <span className="mt-1 rounded-full bg-[hsl(var(--secondary))] px-2 py-1 text-[9px] font-bold text-[hsl(var(--primary))]">Selected</span>}</div></button>;
}

function Settings({ isDark, setIsDark }: { isDark: boolean; setIsDark: (value: boolean) => void }) {
  const [compact, setCompact] = useState(() => localStorage.getItem('resumeflow-compact-editor') === 'true');
  const [showTips, setShowTips] = useState(() => localStorage.getItem('resumeflow-writing-prompts') !== 'false');
  const updateCompact = () => setCompact((value) => {
    localStorage.setItem('resumeflow-compact-editor', String(!value));
    return !value;
  });
  const updateTips = () => setShowTips((value) => {
    localStorage.setItem('resumeflow-writing-prompts', String(!value));
    return !value;
  });
  return <AppShell active="settings"><main className="mx-auto max-w-[900px] px-6 py-12 lg:px-10 lg:py-16"><div className="max-w-[630px]"><p className="font-mono-ui text-[10px] uppercase tracking-[.17em] text-[hsl(var(--accent))]">Your preferences</p><h1 className="mt-3 font-display text-6xl leading-[.9] tracking-tight">A workspace<br /><em className="text-[hsl(var(--primary))]">that fits.</em></h1><p className="mt-6 text-base leading-7 text-[hsl(var(--muted-foreground))]">Small choices for a more comfortable editing ritual. These settings stay on this device.</p></div><div className="mt-12 space-y-4"><PreferenceGroup title="Workspace" caption="How ResumeFlow feels while you work."><PreferenceRow icon={<Palette size={17} />} title="Night reading" copy="Use a darker workspace when the light gets low." control={<Toggle checked={isDark} onChange={() => setIsDark(!isDark)} testId="toggle-night-reading" />} /><PreferenceRow icon={<FileText size={17} />} title="Compact editor" copy="Show more of your resume at once." control={<Toggle checked={compact} onChange={updateCompact} testId="toggle-compact-editor" />} /></PreferenceGroup><PreferenceGroup title="Guidance" caption="A little help, never in the way."><PreferenceRow icon={<CircleHelp size={17} />} title="Writing prompts" copy="Keep the tiny prompts that help you find the sharper sentence." control={<Toggle checked={showTips} onChange={updateTips} testId="toggle-writing-prompts" />} /></PreferenceGroup><div className="flex items-start gap-4 rounded-2xl bg-[hsl(var(--secondary)/.5)] p-5"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[hsl(var(--card))] text-[hsl(var(--primary))]"><LockKeyhole size={16} /></span><div><h2 className="text-sm font-bold">Your work stays yours</h2><p className="mt-1 max-w-[530px] text-xs leading-5 text-[hsl(var(--muted-foreground))]">ResumeFlow is a private workspace. We only use your details to keep your resume ready when you return.</p></div></div></div></main></AppShell>;
}

function PreferenceGroup({ title, caption, children }: { title: string; caption: string; children: ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))]"><div className="border-b border-[hsl(var(--border))] px-5 py-4"><h2 className="text-sm font-bold">{title}</h2><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{caption}</p></div>{children}</section>;
}

function PreferenceRow({ icon, title, copy, control }: { icon: ReactNode; title: string; copy: string; control: ReactNode }) {
  return <div className="flex items-center gap-4 px-5 py-5"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">{icon}</span><div className="min-w-0 flex-1"><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{copy}</p></div>{control}</div>;
}

function Toggle({ checked, onChange, testId }: { checked: boolean; onChange: () => void; testId: string }) {
  return <button role="switch" aria-checked={checked} onClick={onChange} className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition ${checked ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))]'}`} data-testid={testId}><span className={`block size-5 rounded-full bg-[hsl(var(--card))] shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`} /></button>;
}

function NotFound() {
  return <main className="grain grid min-h-[100dvh] place-items-center px-6"><div className="text-center"><Brand /><p className="mt-12 font-mono-ui text-[10px] uppercase tracking-[.18em] text-[hsl(var(--accent))]">404 / missing page</p><h1 className="mt-3 font-display text-6xl">This page wandered off.</h1><p className="mx-auto mt-4 max-w-[390px] text-sm leading-6 text-[hsl(var(--muted-foreground))]">The good news: your resume is still exactly where you left it.</p><Link href="/builder" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-5 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))]" data-testid="link-return-builder">Back to workspace <ArrowRight size={15} /></Link></div></main>;
}

export default App;