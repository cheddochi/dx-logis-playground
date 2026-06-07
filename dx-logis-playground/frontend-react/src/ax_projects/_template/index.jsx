/**
 * AX 과제 커스텀 페이지 템플릿
 *
 * 사용법:
 *   1. 이 파일을 복사해서 ax_projects/{slug}/index.jsx 로 저장
 *   2. App.jsx 상단 import 블록에 추가:
 *        import MyProjectApp from './ax_projects/{slug}'
 *   3. App.jsx 라우트 블록에 추가 (ecommerce-prediction Route 아래):
 *        <Route path="/ax/{slug}/*" element={<MyProjectApp />} />
 *   4. DB에 과제 등록 (MainPage에서 "+ 과제 등록" 클릭, slug는 위와 동일하게)
 *
 * slug 규칙: 영문 소문자, 숫자, 하이픈(-) 만 사용. 예) my-new-project
 */

import { Link } from 'react-router-dom'
import '../../../styles/ax-main.css'

// TODO: 과제명 변경
const PROJECT_NAME = '새 AX 과제'
const PROJECT_SLUG = 'replace-me'   // DB에 등록한 slug와 일치해야 함

export default function TemplateApp() {
  return (
    <div className="ax-wrap">
      {/* GNB */}
      <header className="ax-gnb">
        <a href="/" className="ax-gnb-logo">
          <span className="ax-gnb-badge">AX</span>
          AI Transformation
        </a>
        <div className="ax-gnb-spacer" />
        <Link to="/" className="ax-gnb-btn" style={{ textDecoration: 'none' }}>
          ← 목록으로
        </Link>
      </header>

      <div className="ax-body">
        {/* 사이드바 (필요 시 커스텀) */}
        <aside className="ax-sidebar">
          <div className="ax-sidebar-title">메뉴</div>
          <ul className="ax-sidebar-nav">
            <li><a href="#" className="active">홈</a></li>
            {/* 추가 메뉴 항목 */}
          </ul>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="ax-main">
          <div className="ax-page-head">
            <h1>{PROJECT_NAME}</h1>
            <p>과제 설명을 여기에 작성하세요.</p>
          </div>

          {/* TODO: 과제별 컴포넌트를 여기에 추가 */}
          <div className="ax-card" style={{ maxWidth: 480 }}>
            <p style={{ color: '#999', fontSize: 14 }}>
              이 카드를 삭제하고 실제 콘텐츠를 작성하세요.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
