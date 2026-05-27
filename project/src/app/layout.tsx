import React from 'react';
import './globals.css';

export const metadata = {
  title: 'FocusLock - 몰입형 공부 타이머 및 잠금',
  description: '포커스락으로 공부에 방해되는 요소를 차단하고, 과학적인 타이머와 잠금 모드를 통해 완벽하게 몰입해 보세요. 실시간 학습 통계 및 백색소음도 자체 지원합니다.',
  themeColor: '#06040a',
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
  appleMobileWebAppCapable: 'yes',
  appleMobileWebAppStatusBarStyle: 'black-translucent',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
