import { useEffect } from 'react';
import { 
  fetchWallet, 
  deposit, 
  withdraw, 
  reserveForTrade, 
  releaseReserve 
} from '@/lib/wallet';

const TestWallet = () => {
  useEffect(() => {
    const runTests = async () => {
      const userId = '2ef41f99-2bac-4386-996e-7d516a6342d4';   // ← 당신의 user_id

      console.log('🚀 Wallet 테스트 시작...');

      try {
        // 1. 현재 잔고 확인
        const balance = await fetchWallet(userId, 'KRW');
        console.log('✅ 현재 잔고:', balance);

        // 2. 500원 입금 테스트
        console.log('💰 500원 입금 시도...');
        const afterDeposit = await deposit(userId, 'KRW', 500, { test: true });
        console.log('✅ 입금 후 잔고:', afterDeposit);

        // 3. 200원 출금 테스트
        console.log('💸 200원 출금 시도...');
        const afterWithdraw = await withdraw(userId, 'KRW', 200, null, { test: true });
        console.log('✅ 출금 후 잔고:', afterWithdraw);

        console.log('🎉 모든 테스트 완료!');
      } catch (error: any) {
        console.error('❌ 테스트 실패:', error.message);
      }
    };

    runTests();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Wallet 테스트 중...</h2>
      <p>브라우저 콘솔(F12 → Console)을 확인해주세요.</p>
    </div>
  );
};

export default TestWallet;