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
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length == 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
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

    // 초기 텍스트 동기화:
    // HTML에 작성된 코드 포맷팅(인덴트, 줄바꿈)으로 인해 배너에 과도한 여백이 생기는 것을 막기 위해,
    // 초기 로딩 시 모든 인풋 필드의 value를 강제로 발생시켜 .trim()이 적용된 깔끔한 텍스트로 미리보기 캔버스를 덮어씌웁니다.
    Object.values(inputs).forEach(input => {
        if (input) input.dispatchEvent(new Event('input'));
    });

    // ---------------------------------------------
    // 템플릿 선택 및 전환 로직 추가 (HTML 클래스 제어 뼈대)
    // ---------------------------------------------
    const tplButtons = document.querySelectorAll('.tpl-btn');
    const bannerCanvas = document.getElementById('banner-canvas');

    if (tplButtons.length > 0 && bannerCanvas) {
        tplButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 활성화 상태 시각적 토글 처리
                tplButtons.forEach(b => b.classList.remove('active'));
                const clickedBtn = e.currentTarget;
                clickedBtn.classList.add('active');

                // 기존 템플릿 클래스 삭제 후 새로운 템플릿 할당
                const targetTpl = clickedBtn.dataset.tpl; // 'template-a' 또는 'template-b'
                bannerCanvas.classList.remove('template-a', 'template-b');
                
                // 로고 스위칭 처리
                const logoImg = document.querySelector('.brand-watermark .official-logo');
                if (targetTpl === 'template-b') {
                    if (logoImg) logoImg.src = 'assets/images/LOGO_20SLAB_white.png';
                } else {
                    if (logoImg) logoImg.src = 'assets/images/LOGO_20SLAB.png';
                }

                if (targetTpl) {
                    bannerCanvas.classList.add(targetTpl);
                }
            });
        });

        // 페이지 초기 로드 시 '템플릿 A'를 기본 활성화 상태로 확실히 고정 (초기화)
        const defaultTplBtn = document.querySelector('.tpl-btn[data-tpl="template-a"]');
        if (defaultTplBtn) {
            defaultTplBtn.click();
        }
    }

    // ---------------------------------------------
    // 고화질 이미지 캡처 및 다운로드 기능 (1080px 고정)
    // ---------------------------------------------
    const downloadBtn = document.getElementById('download-btn');

    if (downloadBtn && bannerCanvas) {
        downloadBtn.addEventListener('click', () => {
            // 다운로드 중 시각적 피드백
            const originalText = downloadBtn.textContent;
            downloadBtn.textContent = '이미지 생성 중...';
            downloadBtn.style.pointerEvents = 'none';
            downloadBtn.style.opacity = '0.7';

            // DOM 업데이트(렌더링)가 완전히 끝난 뒤 캡처하도록 지연
            requestAnimationFrame(() => {
                setTimeout(() => {
                    // 1. html2canvas로 매우 높은 해상도(scale 3)로 먼저 캡처
                    const captureScale = 3;

                    html2canvas(bannerCanvas, {
                        scale: captureScale,
                        backgroundColor: '#FFFFFF', // 깔끔한 화이트 배경 고정
                        useCORS: true,
                        logging: false
                    }).then((highResCanvas) => {
                        // 2. 가로 1080px에 맞춰 비율대로 최종 캔버스 생성
                        const targetWidth = 1080;
                        const targetHeight = (targetWidth / highResCanvas.width) * highResCanvas.height;

                        const finalCanvas = document.createElement('canvas');
                        finalCanvas.width = targetWidth;
                        finalCanvas.height = targetHeight;
                        const ctx = finalCanvas.getContext('2d');

                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';

                        // 3. 고해상도 캔버스를 1080px 캔버스로 리사이징해서 그리기
                        ctx.drawImage(highResCanvas, 0, 0, targetWidth, targetHeight);

                        // 4. 추출 후 다운로드 (Blob 방식 도입으로 안정성 강화)
                        finalCanvas.toBlob((blob) => {
                            if (!blob) {
                                console.error('Blob 생성 오류');
                                alert('이미지 파일 처리에 실패했습니다.');
                                downloadBtn.textContent = originalText;
                                downloadBtn.style.pointerEvents = 'auto';
                                downloadBtn.style.opacity = '1';
                                return;
                            }

                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');

                            // 파일명 확실하게 명시적 지정
                            link.download = 'research_banner.png';
                            link.href = url;

                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);

                            // 메모리 해제
                            URL.revokeObjectURL(url);

                            // 상태 원상복구
                            downloadBtn.textContent = originalText;
                            downloadBtn.style.pointerEvents = 'auto';
                            downloadBtn.style.opacity = '1';
                        }, 'image/png'); // 최고 품질 추출
                    }).catch(err => {
                        console.error('캡처 처리 중 오류:', err);
                        alert('이미지 생성에 실패했습니다.');
                        downloadBtn.textContent = originalText;
                        downloadBtn.style.pointerEvents = 'auto';
                        downloadBtn.style.opacity = '1';
                    });
                }, 100);
            });
        });
    }

    // ---------------------------------------------
    // 동적 공고 항목 편집 모드 & 추가 / 삭제 / 드래그 로직
    // ---------------------------------------------
    const dynamicList = document.querySelector('.dynamic-list');
    const addItemBtn = document.querySelector('.add-item-btn');
    const editModeBtn = document.querySelector('.edit-mode-btn');
    const infoList = document.querySelector('.info-list');
    const buildColContent = document.querySelector('.build-col-content');
    
    let dynamicIdCounter = 0;
    let sortableInstance = null;
    let isEditMode = false;

    // 편집 모드 토글
    if (editModeBtn && buildColContent && dynamicList) {
        editModeBtn.addEventListener('click', () => {
            isEditMode = !isEditMode;
            if (isEditMode) {
                // 편집 모드 ON
                editModeBtn.textContent = '편집 완료';
                editModeBtn.classList.add('active');
                addItemBtn.style.display = 'block';
                buildColContent.classList.add('edit-mode-active');
                
                if (!sortableInstance && typeof Sortable !== 'undefined') {
                    sortableInstance = Sortable.create(dynamicList, {
                        handle: '.drag-handle',
                        animation: 150,
                        onEnd: function () {
                            // 배열을 DOM 기준 순서로 가져와서 프리뷰(infoList) 재배치
                            const currentDomItems = Array.from(dynamicList.children);
                            currentDomItems.forEach(listItem => {
                                const previewId = listItem.id.replace('editor-', 'preview-dl-');
                                const previewDl = document.getElementById(previewId);
                                if (previewDl) {
                                    // appendChild는 기존 요소를 떼어내어 맨 뒤로 이동시킴 (결과적으로 동기화됨)
                                    infoList.appendChild(previewDl);
                                }
                            });
                        }
                    });
                } else if (sortableInstance) {
                    sortableInstance.option('disabled', false);
                }
            } else {
                // 편집 모드 OFF
                editModeBtn.textContent = '항목 편집';
                editModeBtn.classList.remove('active');
                addItemBtn.style.display = 'none';
                buildColContent.classList.remove('edit-mode-active');
                if (sortableInstance) {
                    sortableInstance.option('disabled', true);
                }
            }
        });
    }

    // 항목 추가 동작 (편집 모드에서만 보임)
    if (addItemBtn && dynamicList && infoList) {
        addItemBtn.addEventListener('click', () => {
            dynamicIdCounter++;
            const itemId = `dynamic-item-${dynamicIdCounter}`;

            // 에디터 패널 요소 생성 (item-label-group 및 drag-handle 추가됨)
            const listItem = document.createElement('div');
            listItem.className = 'list-item';
            listItem.id = `editor-${itemId}`;
            listItem.innerHTML = `
                <div class="item-header-row">
                    <div class="item-label-group">
                        <span class="drag-handle" title="드래그하여 이동">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="8" x2="20" y2="8"></line><line x1="4" y1="16" x2="20" y2="16"></line></svg>
                        </span>
                        <input type="text" class="dynamic-title-input" placeholder="새로운 항목명 입력" value="">
                    </div>
                    <button type="button" class="del-btn" title="항목 삭제">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
                <div class="form-group">
                    <input type="text" class="dynamic-content-input" placeholder="내용을 입력하세요" value="">
                </div>
            `;

            // 미리보기 패널 요소 생성
            const dl = document.createElement('dl');
            dl.id = `preview-dl-${itemId}`;
            dl.innerHTML = `
                <dt>새 항목</dt>
                <dd>내용을 입력하세요</dd>
            `;

            // 맨 위(진행 일시 등 다른 요소 고려 안함, 편집 추가는 최상단 원칙이므로 일단 prepend)
            // 단, editor-date가 만약 고정형이라면 그 바로 위나 아래로?
            // 기존 요구사항에 따라 prepend(맨위) 유지. 
            dynamicList.prepend(listItem);
            infoList.prepend(dl);

            // 실시간 연동 (onInput)
            const titleInput = listItem.querySelector('.dynamic-title-input');
            const contentInput = listItem.querySelector('.dynamic-content-input');
            const dt = dl.querySelector('dt');
            const dd = dl.querySelector('dd');

            titleInput.addEventListener('input', (e) => {
                dt.textContent = e.target.value.trim() || '새 항목';
            });
            contentInput.addEventListener('input', (e) => {
                dd.textContent = e.target.value.trim() || '내용을 입력하세요';
            });
            
            // 추가 시 제목 입력에 포커스
            titleInput.focus();
        });

        // 이벤트 위임 (Event Delegation) 기반의 항목 삭제 로직
        dynamicList.addEventListener('click', (e) => {
            const delBtn = e.target.closest('.del-btn');
            if (delBtn) {
                const listItem = delBtn.closest('.list-item');
                // 진행 일시(editor-date)는 삭제 예외 처리 (UI에 버튼은 없지만 2중 방어)
                if (listItem && listItem.id !== 'editor-date') { 
                    const previewId = listItem.id.replace('editor-', 'preview-dl-');
                    const previewElement = document.getElementById(previewId);
                    
                    // DOM에서 제거
                    listItem.remove();
                    if (previewElement) previewElement.remove();
                }
            }
        });
    }

    // ---------------------------------------------
    // 임시 저장 (LocalStorage) 구현
    // ---------------------------------------------
    const saveDataBtn = document.getElementById('save-data-btn');

    // 1. 임시 저장하기
    if (saveDataBtn) {
        saveDataBtn.addEventListener('click', () => {
            const data = {
                settings: {
                    title: inputs.title.value,
                    themeColor: themeColorInput.value,
                    notice: inputs.notice.value,
                    template: document.querySelector('.tpl-btn.active').dataset.tpl,
                    dynamicIdCounter: dynamicIdCounter
                },
                items: []
            };

            const listItems = document.querySelectorAll('.dynamic-list .list-item');
            listItems.forEach(item => {
                const id = item.id;
                if (id === 'editor-date') {
                    data.items.push({
                        id: id,
                        type: 'date',
                        dateDate: document.getElementById('date-date').value,
                        dateTime: document.getElementById('date-time').value
                    });
                } else if (item.querySelector('.dynamic-title-input')) {
                    // 동적으로 추가된 항목
                    data.items.push({
                        id: id,
                        type: 'dynamic',
                        title: item.querySelector('.dynamic-title-input').value,
                        content: item.querySelector('.dynamic-content-input').value
                    });
                } else {
                    // target, location, benefit, deadline, announcement 등 기존 부분
                    const inputId = id.replace('editor-', '');
                    data.items.push({
                        id: id,
                        type: 'static',
                        inputId: inputId,
                        content: document.getElementById(inputId).value
                    });
                }
            });

            localStorage.setItem('bannerMakerData', JSON.stringify(data));
            
            // UX 피드백: 알럿 대신 버튼 텍스트 변경
            const originalText = saveDataBtn.textContent;
            saveDataBtn.textContent = '저장 완료! ✅';
            saveDataBtn.style.backgroundColor = '#4CAF50';
            saveDataBtn.style.color = '#FFF';
            
            setTimeout(() => {
                saveDataBtn.textContent = originalText;
                saveDataBtn.style.backgroundColor = '';
                saveDataBtn.style.color = '';
            }, 1500);
        });
    }

    // 2. 초기 로딩 시 저장된 데이터 불러오기
    const loadSavedData = () => {
        const raw = localStorage.getItem('bannerMakerData');
        if (!raw) return;
        
        try {
            const data = JSON.parse(raw);
            
            // 2-1. 기본 설정 복구
            inputs.title.value = data.settings.title || '';
            themeColorInput.value = data.settings.themeColor || '#FC5B4F';
            inputs.notice.value = data.settings.notice || '';
            
            const tplBtn = document.querySelector(`.tpl-btn[data-tpl="${data.settings.template}"]`);
            if (tplBtn) tplBtn.click();
            
            dynamicIdCounter = data.settings.dynamicIdCounter || 0;

            // 2-2. 리스트 아이템 복구를 위한 DOM 추출
            const existingDomItems = {};
            const existingPreviewItems = {};
            Array.from(dynamicList.children).forEach(el => { existingDomItems[el.id] = el; });
            Array.from(infoList.children).forEach(el => { existingPreviewItems[el.id] = el; });

            // 기존 리스트 비우기
            dynamicList.innerHTML = '';
            infoList.innerHTML = '';

            // 2-3. 저장된 순서와 값대로 DOM 재구성
            data.items.forEach(itemData => {
                if (itemData.type === 'date') {
                    const domEl = existingDomItems[itemData.id];
                    const prevEl = existingPreviewItems[itemData.id.replace('editor-', 'preview-dl-')];
                    if (domEl) {
                        domEl.querySelector('#date-date').value = itemData.dateDate;
                        domEl.querySelector('#date-time').value = itemData.dateTime;
                        dynamicList.appendChild(domEl);
                    }
                    if (prevEl) infoList.appendChild(prevEl);
                } else if (itemData.type === 'static') {
                    const domEl = existingDomItems[itemData.id];
                    const prevEl = existingPreviewItems[itemData.id.replace('editor-', 'preview-dl-')];
                    if (domEl) {
                        domEl.querySelector(`#${itemData.inputId}`).value = itemData.content;
                        dynamicList.appendChild(domEl);
                    }
                    if (prevEl) infoList.appendChild(prevEl);
                } else if (itemData.type === 'dynamic') {
                    // 저장된 동적 항목 재생성
                    const itemIdStr = itemData.id.replace('editor-', ''); 
                    
                    const listItem = document.createElement('div');
                    listItem.className = 'list-item';
                    listItem.id = `editor-${itemIdStr}`;
                    listItem.innerHTML = `
                        <div class="item-header-row">
                            <div class="item-label-group">
                                <span class="drag-handle" title="드래그하여 이동">
                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="8" x2="20" y2="8"></line><line x1="4" y1="16" x2="20" y2="16"></line></svg>
                                </span>
                                <input type="text" class="dynamic-title-input" placeholder="새로운 항목명 입력" value="${itemData.title}">
                            </div>
                            <button type="button" class="del-btn" title="항목 삭제">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                        </div>
                        <div class="form-group">
                            <input type="text" class="dynamic-content-input" placeholder="내용을 입력하세요" value="${itemData.content}">
                        </div>
                    `;

                    const dl = document.createElement('dl');
                    dl.id = `preview-dl-${itemIdStr}`;
                    dl.innerHTML = `
                        <dt>${itemData.title || '새 항목'}</dt>
                        <dd>${itemData.content || '내용을 입력하세요'}</dd>
                    `;

                    dynamicList.appendChild(listItem);
                    infoList.appendChild(dl);

                    // 이벤트 리스너 재부착
                    const titleInput = listItem.querySelector('.dynamic-title-input');
                    const contentInput = listItem.querySelector('.dynamic-content-input');
                    const dt = dl.querySelector('dt');
                    const dd = dl.querySelector('dd');

                    titleInput.addEventListener('input', (e) => {
                        dt.textContent = e.target.value.trim() || '새 항목';
                    });
                    contentInput.addEventListener('input', (e) => {
                        dd.textContent = e.target.value.trim() || '내용을 입력하세요';
                    });
                }
            });
            
        } catch(e) {
            console.error("Failed to parse local storage data", e);
        }
    };

    if (dynamicList && infoList) {
        loadSavedData();
    }

    // ---------------------------------------------
    // 초기 로딩 시 입력 폼 값 배너에 강제 동기화 (히드레이션)
    // - 불러온 데이터가 있다면 그 데이터 값으로 즉시 반영됩니다.
    // ---------------------------------------------
    Object.values(inputs).forEach(input => {
        if (input) {
            input.dispatchEvent(new Event('input'));
        }
    });

    if (themeColorInput) {
        themeColorInput.dispatchEvent(new Event('input'));
    }
});
