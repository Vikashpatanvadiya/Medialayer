import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, Info, XCircle, Loader2 } from "lucide-react";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        <Separator className="mt-3" />
      </div>
      {children}
    </section>
  );
}

function ColorSwatch({ name, value, hex }: { name: string; value: string; hex: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-[var(--radius-4)] border border-border shrink-0" style={{ background: hex }} />
      <div>
        <p className="text-xs font-mono text-foreground leading-tight">{name}</p>
        <p className="text-xs text-muted-foreground">{hex}</p>
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="max-w-4xl space-y-14 pb-20">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">MediaLayer</p>
        <h1 className="text-3xl font-semibold text-foreground mb-2" style={{ letterSpacing: "-0.02em" }}>Design System</h1>
        <p className="text-muted-foreground">Tokens from <a href="https://visitors.now" className="underline" target="_blank" rel="noreferrer">visitors.now</a> · Primary = <code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded">--purple-4: #918df6</code></p>
      </div>

      {/* Color palette */}
      <Section title="Color Palette" description="Semantic scale from visitors.now — bg-1 through bg-4, fg-1 through fg-4, plus accent colors.">

        {/* Backgrounds */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Backgrounds</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "bg-1", hex: "#fff", desc: "White" },
              { label: "bg-2", hex: "#f5f5f5", desc: "Subtle" },
              { label: "bg-3", hex: "#f0f0f0", desc: "Muted" },
              { label: "bg-4", hex: "#e8e8e8", desc: "Emphasis" },
            ].map((c) => (
              <div key={c.label} className="rounded-[var(--radius-5)] border border-border overflow-hidden">
                <div className="h-12" style={{ background: c.hex }} />
                <div className="px-3 py-2">
                  <p className="text-xs font-mono text-foreground">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Foregrounds */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Foregrounds</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "fg-1", hex: "#b3b3b3", desc: "Disabled" },
              { label: "fg-2", hex: "#999", desc: "Placeholder" },
              { label: "fg-3", hex: "#666", desc: "Secondary" },
              { label: "fg-4", hex: "#181925", desc: "Primary" },
            ].map((c) => (
              <div key={c.label} className="rounded-[var(--radius-5)] border border-border overflow-hidden">
                <div className="h-12" style={{ background: c.hex }} />
                <div className="px-3 py-2">
                  <p className="text-xs font-mono text-foreground">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accent colors — all 9 families */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Accent Colors (9 families × 4 shades)</p>
          <div className="space-y-1.5">
            {[
              { name: "green",  shades: ["#effbf2","#c2efcd","#71da8b","#33c758"] },
              { name: "sky",    shades: ["#ebf2ff","#bed5fe","#689ffd","#2c78fc"] },
              { name: "purple", shades: ["#f1f1fe","#dad9fc","#b5b3f9","#918df6"] },
              { name: "amber",  shades: ["#fff8eb","#ffeac2","#ffc65c","#ffa600"] },
              { name: "red",    shades: ["#fff3f0","#ffe2db","#ffd5cc","#ff2f00"] },
              { name: "blue",   shades: ["#f0fbff","#c2f1ff","#4cd5ff","#00c4ff"] },
              { name: "yellow", shades: ["#fffdeb","#fff6b3","#ffec5c","#f5d90a"] },
              { name: "pink",   shades: ["#fff0f9","#ffc2e9","#f075c3","#d6409f"] },
              { name: "orange", shades: ["#fff6f0","#ffdac2","#ffa366","#f76808"] },
            ].map((c) => (
              <div key={c.name} className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground w-14 shrink-0">{c.name}</span>
                <div className="flex gap-1 flex-1">
                  {c.shades.map((hex, i) => (
                    <div key={i} className="flex-1 h-8 rounded-[var(--radius-3)] border border-black/5" style={{ background: hex }} title={`${c.name}-${i+1}: ${hex}`} />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground w-16 text-right">{c.shades[3]}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography" description="Inter Variable · -0.02em tracking on headings · -0.01em on body">
        <div className="space-y-3">
          {[
            { size: "text-5xl", weight: "font-semibold", label: "5xl / 48px", text: "Display heading" },
            { size: "text-4xl", weight: "font-semibold", label: "4xl / 36px", text: "Page heading" },
            { size: "text-3xl", weight: "font-semibold", label: "3xl / 30px", text: "Section heading" },
            { size: "text-2xl", weight: "font-semibold", label: "2xl / 24px", text: "Card heading" },
            { size: "text-xl", weight: "font-medium", label: "xl / 20px", text: "Subheading" },
            { size: "text-base", weight: "font-normal", label: "base / 16px", text: "Body text — regular reading content" },
            { size: "text-sm", weight: "font-normal", label: "sm / 14px", text: "Small body — labels and descriptions" },
            { size: "text-xs", weight: "font-normal", label: "xs / 12px", text: "Caption — metadata and timestamps" },
          ].map((t) => (
            <div key={t.label} className="flex items-baseline gap-4">
              <span className="text-xs text-muted-foreground font-mono w-24 shrink-0">{t.label}</span>
              <span className={`${t.size} ${t.weight} text-foreground`} style={{ letterSpacing: "-0.02em" }}>{t.text}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          <span className="text-sm font-normal text-foreground">Regular 400</span>
          <span className="text-sm font-medium text-foreground">Medium 500</span>
          <span className="text-sm font-semibold text-foreground">Semibold 600</span>
          <span className="text-sm font-extrabold text-foreground">Extrabold 800</span>
          <span className="text-sm font-mono text-foreground">Mono — SF Mono</span>
        </div>
      </Section>

      {/* Radius */}
      <Section title="Border Radius" description="visitors.now radius-1 (2px) → radius-6 (16px). Tight, functional scale.">
        <div className="flex flex-wrap gap-6 items-end">
          {[
            { label: "radius-1", px: "2px",  cls: "rounded-[2px]" },
            { label: "radius-2", px: "4px",  cls: "rounded-[4px]" },
            { label: "radius-3", px: "6px",  cls: "rounded-[6px]" },
            { label: "radius-4", px: "8px",  cls: "rounded-[var(--radius-4)]" },
            { label: "radius-5", px: "12px", cls: "rounded-[var(--radius-5)]" },
            { label: "radius-6", px: "16px", cls: "rounded-[var(--radius-6)]" },
            { label: "full",     px: "9999px", cls: "rounded-full" },
          ].map((r) => (
            <div key={r.label} className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 bg-muted border-2 border-border ${r.cls}`} />
              <p className="text-xs text-muted-foreground font-mono">{r.label}</p>
              <p className="text-[10px] text-muted-foreground/60">{r.px}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Shadows */}
      <Section title="Shadows" description="visitors.now layered shadow system — shadow-1 (subtle) → shadow-4 (elevated).">
        <div className="flex flex-wrap gap-4">
          {[
            { label: "shadow-1", style: "0px 1px 1px #00000014, 0px 0px 0px 1px #0000000d" },
            { label: "shadow-2", style: "0px 1px 3px #00000014, 0px 0px 0px 1px #00000005" },
            { label: "shadow-3", style: "0px 1px 3px #0000000f, 0px 8px 16px #0000000f, 0px 0px 0px 1px #00000005" },
            { label: "shadow-4", style: "0px 3px 12px #0000000f, 0px 4px 16px #0000000f, 0px 0px 0px 1px #00000008" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-3">
              <div className="w-24 h-16 bg-card rounded-[var(--radius-5)] flex items-center justify-center" style={{ boxShadow: s.style }}>
                <p className="text-[10px] text-muted-foreground font-mono">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Buttons" description="rounded-4xl (pill) · from button.tsx · primary = near-black · destructive = soft red bg">
        <div className="space-y-4">
          {/* Variants */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Variants</p>
            <div className="flex flex-wrap gap-2 items-center">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
            {/* Token breakdown */}
            <div className="mt-3 grid grid-cols-2 gap-2 max-w-lg text-xs">
              {[
                { v: "default", desc: "bg-primary · text-primary-foreground · purple-4 #918df6" },
                { v: "secondary", desc: "bg-secondary · text-secondary-foreground" },
                { v: "outline", desc: "border-border · bg-input/30 · hover:bg-input/50" },
                { v: "ghost", desc: "transparent · hover:bg-muted" },
                { v: "destructive", desc: "bg-destructive/10 · text-destructive (soft)" },
                { v: "link", desc: "text-primary · underline on hover" },
              ].map((b) => (
                <div key={b.v} className="flex gap-2">
                  <span className="font-mono text-foreground w-20 shrink-0">{b.v}</span>
                  <span className="text-muted-foreground">{b.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Sizes</p>
            <div className="flex flex-wrap gap-2 items-center">
              <Button size="lg">Large h-10</Button>
              <Button size="default">Default h-9</Button>
              <Button size="sm">Small h-8</Button>
              <Button size="xs">XSmall h-6</Button>
              <Button size="icon"><CheckCircle2 className="size-4" /></Button>
              <Button size="icon-sm"><CheckCircle2 className="size-4" /></Button>
              <Button size="icon-xs"><CheckCircle2 className="size-3" /></Button>
            </div>
          </div>

          {/* States */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">States</p>
            <div className="flex flex-wrap gap-2">
              <Button disabled>Disabled</Button>
              <Button disabled variant="outline">Disabled outline</Button>
              <Button><Loader2 className="size-4 animate-spin" /> Loading</Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Inputs */}
      <Section title="Form Controls">
        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <div className="space-y-1.5">
            <Label>Default</Label>
            <Input placeholder="name@company.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Disabled</Label>
            <Input placeholder="Disabled" disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Error state</Label>
            <Input placeholder="Invalid" aria-invalid="true" />
            <p className="text-xs text-destructive">This field is required.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
        </div>
        <div className="flex flex-wrap gap-6 mt-2">
          <div className="flex items-center gap-2"><Checkbox defaultChecked /><Label>Checked</Label></div>
          <div className="flex items-center gap-2"><Checkbox /><Label>Unchecked</Label></div>
          <div className="flex items-center gap-2"><Switch defaultChecked /><Label>On</Label></div>
          <div className="flex items-center gap-2"><Switch /><Label>Off</Label></div>
        </div>
      </Section>

      {/* Badges */}
      <Section title="Badges & Status">
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
        {/* visitors.now style status pills */}
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            { label: "Approved", bg: "#effbf2", color: "#33c758", border: "#c2efcd" },
            { label: "Pending", bg: "#fff8eb", color: "#ffa600", border: "#ffeac2" },
            { label: "Rejected", bg: "#fff3f0", color: "#ff2f00", border: "#ffe2db" },
            { label: "Uploaded", bg: "#ebf2ff", color: "#2c78fc", border: "#bed5fe" },
            { label: "New", bg: "#f1f1fe", color: "#918df6", border: "#dad9fc" },
          ].map((s) => (
            <span key={s.label} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
              style={{ background: s.bg, color: s.color, borderColor: s.border }}>
              {s.label}
            </span>
          ))}
        </div>
      </Section>

      {/* Alerts */}
      <Section title="Alerts">
        <div className="space-y-2 max-w-lg">
          <Alert><Info className="size-4" /><AlertTitle>Info</AlertTitle><AlertDescription>Informational message.</AlertDescription></Alert>
          <Alert variant="destructive"><XCircle className="size-4" /><AlertTitle>Error</AlertTitle><AlertDescription>Something went wrong.</AlertDescription></Alert>
          {[
            { bg: "#effbf2", border: "#c2efcd", color: "#33c758", textColor: "#166534", icon: <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#33c758" }} />, title: "Success", msg: "Your changes have been saved." },
            { bg: "#fff8eb", border: "#ffeac2", color: "#ffa600", textColor: "#92400e", icon: <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#ffa600" }} />, title: "Warning", msg: "Please verify your email." },
          ].map((a) => (
            <div key={a.title} className="flex items-start gap-2.5 rounded-[var(--radius-5)] border p-3.5 text-sm"
              style={{ background: a.bg, borderColor: a.border, color: a.textColor }}>
              {a.icon}
              <div><p className="font-semibold">{a.title}</p><p className="opacity-80">{a.msg}</p></div>
            </div>
          ))}
        </div>
      </Section>

      {/* Cards */}
      <Section title="Cards & Surfaces">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-5">
            <p className="text-sm font-semibold text-foreground mb-1">Default card</p>
            <p className="text-xs text-muted-foreground">bg-card · border-border · rounded-[var(--radius-4)]</p>
          </Card>
          <div className="p-5 rounded-[var(--radius-5)] border" style={{ background: "var(--bg-2)", borderColor: "var(--gray-2)" }}>
            <p className="text-sm font-semibold text-foreground mb-1">bg-2 surface</p>
            <p className="text-xs text-muted-foreground">#f5f5f5 · visitors.now subtle</p>
          </div>
          <div className="p-5 rounded-[var(--radius-5)] border" style={{ background: "var(--green-1)", borderColor: "var(--green-2)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--green-4)" }}>Green accent</p>
            <p className="text-xs text-muted-foreground">green-1 bg · green-2 border</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {["shadow-sm", "shadow", "shadow-md", "shadow-lg"].map((s) => (
            <div key={s} className={`w-20 h-16 bg-card rounded-[var(--radius-5)] ${s} flex items-center justify-center border border-border`}>
              <p className="text-[10px] text-muted-foreground font-mono text-center">{s}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Avatars & Progress */}
      <Section title="Avatars & Progress">
        <div className="flex items-center gap-3">
          {["ML", "CR", "ED", "VW"].map((init, i) => {
            const colors = [["#effbf2", "#33c758"], ["#ebf2ff", "#2c78fc"], ["#f1f1fe", "#918df6"], ["#fff8eb", "#ffa600"]];
            return (
              <Avatar key={init}>
                <AvatarFallback style={{ background: colors[i][0], color: colors[i][1] }} className="font-bold text-sm">{init}</AvatarFallback>
              </Avatar>
            );
          })}
        </div>
        <div className="space-y-2 max-w-sm mt-2">
          <Progress value={25} />
          <Progress value={50} />
          <Progress value={75} />
          <Progress value={100} />
        </div>
      </Section>

      {/* Tabs */}
      <Section title="Tabs">
        <Tabs defaultValue="overview" className="max-w-md">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4 text-sm text-muted-foreground">Overview content.</TabsContent>
          <TabsContent value="analytics" className="mt-4 text-sm text-muted-foreground">Analytics content.</TabsContent>
          <TabsContent value="settings" className="mt-4 text-sm text-muted-foreground">Settings content.</TabsContent>
        </Tabs>
      </Section>

      {/* MediaLayer status patterns */}
      <Section title="MediaLayer Status Patterns" description="Video workflow states using visitors.now accent colors.">
        <div className="grid grid-cols-2 gap-3 max-w-lg">
          {[
            { status: "pending", label: "Needs Review", bg: "var(--amber-1)", border: "var(--amber-2)", color: "var(--amber-4)", icon: <AlertTriangle className="w-4 h-4" style={{ color: "var(--amber-4)" }} /> },
            { status: "approved", label: "Approved", bg: "var(--green-1)", border: "var(--green-2)", color: "var(--green-4)", icon: <CheckCircle2 className="w-4 h-4" style={{ color: "var(--green-4)" }} /> },
            { status: "rejected", label: "Rejected", bg: "var(--red-1)", border: "var(--red-2)", color: "var(--red-4)", icon: <XCircle className="w-4 h-4" style={{ color: "var(--red-4)" }} /> },
            { status: "uploaded", label: "Uploaded to YouTube", bg: "var(--sky-1)", border: "var(--sky-2)", color: "var(--sky-4)", icon: <CheckCircle2 className="w-4 h-4" style={{ color: "var(--sky-4)" }} /> },
          ].map((s) => (
            <div key={s.status} className="flex items-center gap-3 p-4 rounded-[var(--radius-5)] border"
              style={{ background: s.bg, borderColor: s.border }}>
              {s.icon}
              <div>
                <p className="text-sm font-semibold" style={{ color: s.color }}>{s.label}</p>
                <p className="text-xs text-muted-foreground capitalize">{s.status}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

    </div>
  );
}
