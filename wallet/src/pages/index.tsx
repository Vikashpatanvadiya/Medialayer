import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { WalletButton } from '../components/WalletButton';
import { SendPayment } from '../components/SendPayment';
import { useWallet } from '@solana/wallet-adapter-react';

const PLANS: Record<string, { name: string; price: string; sol: string; features: string[] }> = {
  starter: {
    name: 'Starter',
    price: '$50',
    sol: '0.5',
    features: ['1 creator account', 'Up to 3 editors', 'Unlimited video reviews', 'Direct YouTube publishing', 'Lifetime access'],
  },
  pro: {
    name: 'Pro',
    price: '$100',
    sol: '1.0',
    features: ['Unlimited creator accounts', 'Unlimited editors', 'Unlimited video reviews', 'Priority support', 'Audit logs & analytics', 'Lifetime access'],
  },
};

const Home: NextPage = () => {
  const router = useRouter();
  const { publicKey } = useWallet();
  const planKey = (router.query.plan as string) || 'starter';
  const plan = PLANS[planKey] || PLANS.starter;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <img src="https://medialayer.vercel.app/Medialayer-Indigo.svg" alt="MediaLayer" style={{ height: 28 }} />
        <p style={{ margin: '8px 0 0', fontSize: 13, color: '#6b7280' }}>Secure checkout via Solana</p>
      </div>

      <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Plan summary card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan</p>
              <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: '#1a1f3c' }}>{plan.name}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#4f46e5' }}>{plan.price}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>one-time · ≈ {plan.sol} SOL</p>
            </div>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {plan.features.map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                <span style={{ color: '#4f46e5', fontWeight: 700 }}>✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Wallet connect + payment */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          {!publicKey ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 14, color: '#374151', fontWeight: 500, textAlign: 'center' }}>Connect your Solana wallet to pay</p>
              <WalletButton />
            </div>
          ) : (
            <SendPayment defaultAmount={plan.sol} planName={plan.name} />
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', margin: 0 }}>
          Payments are processed on the Solana blockchain. No refunds after transaction is confirmed.
        </p>
      </div>
    </div>
  );
};

export default Home;
