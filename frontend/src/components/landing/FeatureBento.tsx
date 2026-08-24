const ACCENT = "var(--purple-4)";

type FeatureCard = {
  label: string;
  title: string;
  desc: string;
  image: string;
};

const FEATURE_CARDS: FeatureCard[] = [
  {
    label: "Workflow",
    title: "Your entire pipeline, connected",
    desc: "From secure upload to in-browser review to publishing on YouTube and Instagram — every step of the creator–editor workflow lives in one place. No Drive links, no re-uploads.",
    image: "/features/cards/c101e223-adb1-41e0-86a3-24f4857f7812.png",
  },
  {
    label: "Team access",
    title: "Built for creators and editors",
    desc: "Separate dashboards for each role. Connect via invite code and manage access without shared passwords.",
    image: "/features/cards/6fe0dd2e-f746-43b3-afa1-ec31485115ab.png",
  },
  {
    label: "Video review",
    title: "Review in the browser",
    desc: "Watch videos securely without downloading. Signed URLs expire in 1 hour — no public links, ever.",
    image: "/features/cards/e6ace1f4-37cb-49d5-ab92-bc35d8b8d0ef.png",
  },
  {
    label: "Approvals",
    title: "Approve with one click",
    desc: "Approve or reject with feedback. Your editor is notified instantly across every device.",
    image: "/features/cards/0c515a10-0817-4cfe-a66b-46902da75d6e.png",
  },
  {
    label: "Security",
    title: "Privacy-first by design",
    desc: "AES-256 encrypted tokens, OAuth login, and signed URLs. Your content never sits on a public link.",
    image: "/features/cards/16346b0e-9d9a-4047-b96d-9e79de12c1af.png",
  },
  {
    label: "Publishing",
    title: "Publish to YouTube and Instagram",
    desc: "Push approved videos straight to your YouTube channel, or post them as an Instagram Reel or feed post. One approval, either destination — no re-uploading, no extra tools.",
    image: "/features/cards/5751e5bd-b1ce-4da8-b79c-dc07a886a4fa.png",
  },
];

function BentoCard({ card }: { card: FeatureCard }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[22px] border border-[#ebebeb] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="relative w-full overflow-hidden aspect-[16/10] sm:aspect-[5/3]">
        <img
          src={card.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center select-none pointer-events-none"
          draggable={false}
        />
      </div>

      <div className="flex flex-1 flex-col px-6 pb-7 pt-6 sm:px-8 sm:pb-8 sm:pt-7">
        <p
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: ACCENT }}
        >
          {card.label}
        </p>
        <h3
          className="mb-3 text-[#111] leading-[1.2] font-semibold tracking-[-0.02em]"
          style={{ fontSize: "clamp(20px, 2vw, 24px)" }}
        >
          {card.title}
        </h3>
        <p className="text-[#666] leading-[1.6]" style={{ fontSize: "15px" }}>
          {card.desc}
        </p>
      </div>
    </article>
  );
}

export function FeatureBento() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
      {FEATURE_CARDS.map((card) => (
        <BentoCard key={card.label} card={card} />
      ))}
    </div>
  );
}
