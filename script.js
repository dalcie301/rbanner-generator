document.addEventListener('DOMContentLoaded', () => {
    // 폼 요소 선택
    const inputs = {
        title: document.getElementById('title'),
        target: document.getElementById('target'),
        dateDate: document.getElementById('date-date'),
        dateTime: document.getElementById('date-time'),
        location: document.getElementById('location'),
        benefit: document.getElementById('benefit'),
        deadline: document.getElementById('deadline'),
        announcement: document.getElementById('announcement'),
        notice: document.getElementById('notice')
    };

    // 미리보기(캔버스) 요소 선택
    const previews = {
        title: document.getElementById('preview-title'),
        target: document.getElementById('preview-target'),
        dateDate: document.getElementById('preview-date-date'),
        dateTime: document.getElementById('preview-date-time'),
        location: document.getElementById('preview-location'),
        benefit: document.getElementById('preview-benefit'),
        deadline: document.getElementById('preview-deadline'),
        announcement: document.getElementById('preview-announcement'),
        notice: document.getElementById('preview-notice')
    };

    const themeColorInput = document.getElementById('theme-color');
    const root = document.documentElement;
    const highlightRow = document.querySelector('.highlight-row');

    // 텍스트 업데이트 헬퍼
    const updateText = (previewElement, value, defaultText) => {
        if (!previewElement) return;
        previewElement.textContent = value.trim() || defaultText;
    };

    // 이벤트 리스너: 단일 텍스트 바인딩
    const bindInputToPreview = (inputId, defaultText) => {
        if (inputs[inputId] && previews[inputId]) {
            inputs[inputId].addEventListener('input', (e) => {
                updateText(previews[inputId], e.target.value, defaultText);
            });
        }
    };

    bindInputToPreview('title', '리서치 제목을 입력하세요');
    bindInputToPreview('target', '입력 없음');
    bindInputToPreview('dateDate', '날짜 미정');
    bindInputToPreview('dateTime', '시간 미정');
    bindInputToPreview('location', '장소 미정');
    bindInputToPreview('benefit', '혜택 미정');
    bindInputToPreview('deadline', '마감일 미정');
    bindInputToPreview('announcement', '안내일 미정');
    bindInputToPreview('notice', '');

    // 테마 컬러 변경 (상단 라인, 하이라이트 등 CSS 변수로 전파)
    const hex2rgba = (hex, alpha) => {
        // HEX to RGB
        let c;
        if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
            c= hex.substring(1).split('');
            if(c.length== 3){
                c= [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c= '0x'+c.join('');
            return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
        }
        return `rgba(0,0,0,${alpha})`;
    };

    themeColorInput.addEventListener('input', (e) => {
        const color = e.target.value;
        root.style.setProperty('--primary', color);
        
        // 하이라이트 배경색(alpha값 사용)
        if (highlightRow) {
            highlightRow.style.backgroundColor = hex2rgba(color, 0.04);
        }
    });

    // 초기 색상 세팅 (초기 로딩 시 한번 실행하여 rgba 배경 처리)
    if (themeColorInput) {
        themeColorInput.dispatchEvent(new Event('input'));
    }
});