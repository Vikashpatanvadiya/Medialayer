import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { useState } from 'react';

const YOUR_ADDRESS = '9oBgTB8ZQ5qkeEbUP65QWaVKG2BfcY8iUUcgPWAov5W';

interface Props {
  defaultAmount?: string;
  planName?: string;
}

export const SendPayment = ({ defaultAmount = '', planName = '' }: Props) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [amount, setAmount] = useState(defaultAmount);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [txSig, setTxSig] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSend = async () => {
    if (!publicKey || !amount) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const toPubkey = new PublicKey(YOUR_ADDRESS);
      const transaction = new Transaction().add(
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey, lamports: parseFloat(amount) * LAMPORTS_PER_SOL })
      );
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      setTxSig(signature);
      setStatus('success');
    } catch (e: any) {
      setErrorMsg(e.message || 'Transaction failed');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '8px 0' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✅</div>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#065f46' }}>Payment confirmed!</p>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
          Your {planName} plan is now active. Check your email for access details.
        </p>
        <a
          href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
          target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 12, color: '#4f46e5', textDecoration: 'underline' }}
        >
          View transaction on Explorer
        </a>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={labelStyle}>Your wallet</label>
        <div style={addressStyle}>{publicKey?.toBase58()}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={labelStyle}>Sending to</label>
        <div style={addressStyle}>{YOUR_ADDRESS}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={labelStyle}>Amount (SOL)</label>
        <input
          style={inputStyle}
          type="number" placeholder="0.00" min="0" step="0.001"
          value={amount} onChange={e => setAmount(e.target.value)}
        />
      </div>

      <button
        style={{ ...btnStyle, opacity: status === 'loading' || !amount ? 0.6 : 1, cursor: status === 'loading' || !amount ? 'not-allowed' : 'pointer' }}
        onClick={handleSend}
        disabled={status === 'loading' || !amount}
      >
        {status === 'loading' ? 'Confirming…' : `Pay ${amount ? amount + ' SOL' : ''}`}
      </button>

      {status === 'error' && (
        <p style={{ margin: 0, fontSize: 13, color: '#dc2626', textAlign: 'center' }}>❌ {errorMsg}</p>
      )}
    </div>
  );
};

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' };
const addressStyle: React.CSSProperties = { fontSize: 11, color: '#374151', background: '#f3f4f6', padding: '8px 10px', borderRadius: 8, wordBreak: 'break-all', fontFamily: 'monospace' };
const inputStyle: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none', fontFamily: 'Inter, sans-serif', width: '100%' };
const btnStyle: React.CSSProperties = { padding: '13px', borderRadius: 12, border: 'none', background: '#4f46e5', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'Inter, sans-serif', marginTop: 4 };
