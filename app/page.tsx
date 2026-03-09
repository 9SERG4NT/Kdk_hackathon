"use client";

import { useIssues } from "@/features/issues/hooks/useIssues";
import { format } from "date-fns";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CircleUserRound,
  Home,
  Loader2,
  Map,
  Mic,
  PlusCircle,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Video,
  ZoomIn,
  Camera,
  Activity,
  LocateFixed,
} from "lucide-react";

export default function DashboardPage() {
  const { data: issues = [], isLoading } = useIssues();
  const latestIssue = issues[0];
  const recentIssues = issues.slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-[#f6f8f6] text-slate-900">
      <div className="flex h-full overflow-hidden">
        <aside className="hidden w-64 shrink-0 border-r border-[#4bbe4f]/15 bg-white p-4 lg:flex lg:flex-col lg:justify-between">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3 px-2">
              <div className="rounded-lg bg-[#4bbe4f] p-2 text-white">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-bold leading-tight">SmartCity AI</h1>
                <p className="text-xs font-medium text-[#4bbe4f]">Camera Reporting</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              <NavItem label="Home" icon={<Home className="h-4 w-4" />} active={false} />
              <NavItem label="Report Issue" icon={<AlertTriangle className="h-4 w-4" />} active />
              <NavItem label="City Map" icon={<Map className="h-4 w-4" />} active={false} />
              <NavItem label="Analytics" icon={<BarChart3 className="h-4 w-4" />} active={false} />
              <NavItem label="Settings" icon={<Settings className="h-4 w-4" />} active={false} />
            </nav>
          </div>

          <div className="flex flex-col gap-3">
            <button className="flex items-center justify-center gap-2 rounded-xl bg-[#4bbe4f] py-3 text-sm font-bold text-white shadow-lg shadow-[#4bbe4f]/25 transition hover:bg-[#3ea942]">
              <PlusCircle className="h-4 w-4" />
              <span>New Scan</span>
            </button>

            <div className="flex items-center gap-3 border-t border-[#4bbe4f]/15 px-2 pt-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4bbe4f]/15 text-[#4bbe4f]">
                <CircleUserRound className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold">Operator 42</p>
                <p className="text-[10px] text-slate-500">Active Duty</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-16 items-center justify-between border-b border-[#4bbe4f]/15 bg-white px-4 md:px-8">
            <div className="flex w-full max-w-xl items-center gap-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-xl border-none bg-[#f2f5f2] py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#4bbe4f]/50"
                  placeholder="Search incidents, cameras, or zones..."
                  type="text"
                />
              </div>
            </div>

            <div className="ml-3 flex items-center gap-3">
              <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2f5f2] text-slate-600">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
              </button>
              <button className="hidden items-center gap-2 rounded-xl border border-[#4bbe4f]/20 bg-[#4bbe4f]/10 px-3 py-1.5 text-xs font-bold text-[#4bbe4f] md:flex">
                <ShieldCheck className="h-3.5 w-3.5" />
                AI Live
              </button>
            </div>
          </header>

          <div className="flex flex-1 gap-6 overflow-hidden p-4 md:p-6">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <div className="group relative flex-1 overflow-hidden rounded-2xl bg-slate-900">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-80"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAbU773ap7VfEp5plMhOMZfgNqgBZxfziz6Hisukx52fnxDvRmJSvf4CYcDJULoRdWS2wypu5472vGxZT3pVhRtDiu2lcew26T9fylH3gsSPd8yJb-bXDhUP9J02bk_Ank492BcpeCmfDdj5aj9RaRvJUKPGpcyMUKRQi3Qm0nlyyXFOJEHL9A_gf8eleEvEEWpkhREpid_R3XQC3Jhm3nkbyRlUIAIWX9KcO_jAdzHOmswMQr20z7DePtoXkfdiQnGllvF3lCLblBQ')",
                  }}
                />

                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-1/3 top-1/2 h-32 w-48 rounded-lg border-2 border-[#4bbe4f]">
                    <span className="absolute -top-6 left-0 rounded-t-lg bg-[#4bbe4f] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      POTHOLE [CONF: 98%]
                    </span>
                    <div className="absolute inset-0 animate-pulse bg-[#4bbe4f]/10" />
                  </div>

                  <div className="absolute left-1/2 top-1/3 h-24 w-36 rounded-lg border-2 border-yellow-400">
                    <span className="absolute -top-6 left-0 rounded-t-lg bg-yellow-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-900">
                      Damaged Pavement
                    </span>
                  </div>
                </div>

                <div className="absolute left-4 top-4 flex gap-2">
                  <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 font-mono text-[10px] text-white backdrop-blur-md">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                    LIVE FEED: CAM-04-A
                  </div>
                  <div className="rounded-full bg-black/60 px-3 py-1 font-mono text-[10px] uppercase text-white backdrop-blur-md">
                    {latestIssue
                      ? `${latestIssue.latitude.toFixed(4)}N, ${latestIssue.longitude.toFixed(4)}E`
                      : "21.1458N, 79.0882E"}
                  </div>
                </div>

                <div className="absolute bottom-6 right-6 flex flex-col gap-3">
                  <OverlayIconButton icon={<ZoomIn className="h-4 w-4" />} />
                  <OverlayIconButton icon={<Camera className="h-4 w-4" />} />
                  <OverlayIconButton icon={<Video className="h-4 w-4" />} />
                </div>

                <div className="absolute bottom-6 left-1/2 w-full max-w-xl -translate-x-1/2 px-4">
                  <div className="flex items-center justify-between gap-6 rounded-2xl border border-[#4bbe4f]/20 bg-white/90 p-4 shadow-2xl backdrop-blur-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4bbe4f]/20 text-[#4bbe4f]">
                        <Activity className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">
                          Auto-detected: {latestIssue?.category ?? "Pothole"}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                            HIGH SEVERITY
                          </span>
                          <span className="text-xs text-slate-500">
                            {latestIssue?.title ?? "Avenue 4, North Sector"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold transition-colors hover:bg-slate-300">
                        Retake
                      </button>
                      <button className="rounded-xl bg-[#4bbe4f] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#4bbe4f]/20 transition-all hover:bg-[#3ea942]">
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button className="flex flex-1 items-center justify-center gap-3 rounded-xl border border-[#4bbe4f]/15 bg-white py-4 font-semibold text-slate-700 transition-all hover:border-[#4bbe4f]/40 hover:bg-[#4bbe4f]/5">
                  <Mic className="h-4 w-4 text-[#4bbe4f]" />
                  Add Voice Description
                </button>
                <button className="flex flex-1 items-center justify-center gap-3 rounded-xl bg-[#4bbe4f] py-4 font-bold text-white shadow-lg shadow-[#4bbe4f]/20 transition-all hover:bg-[#3ea942]">
                  <Send className="h-4 w-4" />
                  Submit Full Report
                </button>
              </div>
            </div>

            <aside className="hidden w-80 shrink-0 flex-col gap-6 xl:flex">
              <div className="flex h-1/2 flex-col rounded-2xl border border-[#4bbe4f]/15 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-bold text-slate-800">
                    <LocateFixed className="h-5 w-5 text-[#4bbe4f]" />
                    Location View
                  </h2>
                  <button className="text-xs font-bold text-[#4bbe4f]">Expand</button>
                </div>
                <div className="relative flex-1 overflow-hidden rounded-xl">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC3hNt0E7mluKyZNeUQ2P5t4u_CIZeuNKHHHtaZZgRzthVgdtxDvg3rk_A3muI-fiagVqGu4VpDt5luvw0TkO6r_mOroNOfTa_JjhMEDNglJbnqkKzuIn3T5hfTdJyRwLv_t6Pt9koI3BJb0er7-grPf610ar_496wBuxBny66QU2imrJ8NEYe2lGxw6Pqylj7BVjt4SLSnVNUle53gWxrEZMT_5FE3AxBDnfQVDjCITWXbL2CktkSK-T3zLVnlnJttyQffPw1gf4jx')",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-8 w-8 animate-bounce items-center justify-center rounded-full border-4 border-white bg-[#4bbe4f] shadow-lg">
                      <Map className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Current Zone
                  </p>
                  <p className="text-sm font-medium">Sector 4 - Commercial District</p>
                </div>
              </div>

              <div className="flex flex-1 flex-col rounded-2xl border border-[#4bbe4f]/15 bg-white p-5">
                <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-800">
                  <Activity className="h-5 w-5 text-[#4bbe4f]" />
                  Recent History
                </h2>

                <div className="flex flex-col gap-4">
                  {recentIssues.length === 0 ? (
                    <p className="text-xs text-slate-500">No incidents yet.</p>
                  ) : (
                    recentIssues.map((issue, idx) => (
                      <div
                        key={issue.id}
                        className={`flex items-start gap-3 border-l-2 pl-4 py-1 ${
                          idx === 1 ? "border-[#4bbe4f]" : "border-[#4bbe4f]/20"
                        }`}
                      >
                        <div className="mt-0.5 min-w-[40px] text-[10px] font-mono text-slate-500">
                          {format(new Date(issue.created_at), "HH:mm")}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${idx === 1 ? "text-[#4bbe4f]" : "text-slate-900"}`}>
                            {issue.title}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {issue.status} - {issue.category}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button className="mt-auto w-full rounded-xl bg-[#4bbe4f]/5 py-2 text-xs font-bold text-[#4bbe4f] transition-colors hover:bg-[#4bbe4f]/10">
                  View Activity Log
                </button>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({
  label,
  icon,
  active,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <button
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
        active
          ? "bg-[#4bbe4f]/10 text-[#4bbe4f]"
          : "text-slate-600 hover:bg-[#4bbe4f]/10 hover:text-[#4bbe4f]"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function OverlayIconButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20">
      {icon}
    </button>
  );
}
