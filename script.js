document.addEventListener('DOMContentLoaded', () => {
    const LAST_STATE_KEYS = {
        template: 'bannerMaker:lastTemplate',
        mode: 'bannerMaker:lastMode'
    };

    // 공식 로고 업로드 상태 (세션 한정)
    let uploadedLogoSrc = null;

    const panelLogo = document.querySelector('.panel-logo');
    const logoUploadBtn = document.getElementById('logo-upload-btn');
    const logoUploadInput = document.getElementById('logo-upload-input');
    const defaultPanelLogoSrc = panelLogo ? panelLogo.src : '';

    const applyLogoPreviewToPanel = () => {
        if (!panelLogo) return;
        panelLogo.src = uploadedLogoSrc || defaultPanelLogoSrc;
    };

    const applyLogoPreviewToWatermark = (targetTpl) => {
        const logoImg = document.querySelector('.brand-watermark .official-logo');
        if (!logoImg) return;
        if (uploadedLogoSrc) {
            logoImg.src = uploadedLogoSrc;
            return;
        }
        if (targetTpl === 'template-b') {
            logoImg.src = 'assets/images/LOGO_20SLAB_white.png';
        } else {
            logoImg.src = 'assets/images/LOGO_20SLAB.png';
        }
    };

    const getEffectiveLogoSrc = (defaultSrc) => uploadedLogoSrc || defaultSrc;

    if (logoUploadBtn && logoUploadInput) {
        logoUploadBtn.addEventListener('click', () => {
            logoUploadInput.click();
        });

        logoUploadInput.addEventListener('change', (event) => {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            if (file.type && !file.type.startsWith('image/')) {
                alert('이미지 파일만 업로드할 수 있습니다.');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result !== 'string') return;
                uploadedLogoSrc = reader.result;
                applyLogoPreviewToPanel();
                applyLogoPreviewToWatermark(document.querySelector('.tpl-btn.active')?.dataset.tpl || 'template-a');
                if (typeof runLayoutEngine === 'function') {
                    requestAnimationFrame(() => runLayoutEngine());
                }
            };
            reader.readAsDataURL(file);
            event.target.value = '';
        });
    }

    // 폼 요소 선택
    const inputs = {
        titleLine1: document.getElementById('title-line1'),
        titleLine2: document.getElementById('title-line2'),
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
        titleLine1: document.getElementById('preview-title-line1'),
        titleLine2: document.getElementById('preview-title-line2'),
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

    // 현재 강조된 preview-dl ID
    let currentHighlightId = null;

    // 유동 하이라이트 적용 함수 (한 번에 하나만 강조)
    const applyHighlight = (previewDlId) => {
        // 1. 모든 dl에서 highlight-row 제거
        document.querySelectorAll('.info-list dl.highlight-row').forEach(dl => {
            dl.classList.remove('highlight-row');
        });
        // 2. 모든 체크박스 해제
        document.querySelectorAll('.highlight-checkbox').forEach(cb => {
            cb.checked = false;
        });

        currentHighlightId = previewDlId;
        if (!previewDlId) return;

        // 3. 지정된 dl에 highlight-row 클래스 적용
        const targetDl = document.getElementById(previewDlId);
        if (targetDl) targetDl.classList.add('highlight-row');

        // 4. 해당 편집 체크박스를 체크 상태로 (editor ID 연산)
        const editorId = previewDlId.replace('preview-dl-', 'editor-');
        const editorItem = document.getElementById(editorId);
        if (editorItem) {
            const cb = editorItem.querySelector('.highlight-checkbox');
            if (cb) cb.checked = true;
        }
    };

    // 텍스트 업데이트 헬퍼
    let updateText = (previewElement, value, defaultText) => {
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

    bindInputToPreview('titleLine1', '리서치 제목 첫번째 줄을 입력하세요');
    bindInputToPreview('titleLine2', '');
    bindInputToPreview('target', '입력 없음');
    bindInputToPreview('dateDate', '날짜 미정');
    bindInputToPreview('dateTime', '시간 미정');
    bindInputToPreview('location', '장소 미정');
    // benefit은 select 드롭다운으로 교체 → updateReward()로 별도 처리
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
        // 선택한 테마 컬러를 약 10% 투명도의 음영 컬러로도 함께 노출
        const tint = hex2rgba(color, 0.10);
        root.style.setProperty('--primary-tint-15', tint);
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
                const targetTpl = clickedBtn.dataset.tpl || 'template-a'; // 'template-a' 또는 'template-b'
                bannerCanvas.classList.remove('template-a', 'template-b');

                // 로고 스위칭 처리 (업로드 로고 우선)
                applyLogoPreviewToWatermark(targetTpl);

                // 마지막 사용 템플릿 세션 저장
                try {
                    sessionStorage.setItem(LAST_STATE_KEYS.template, targetTpl);
                } catch (_) {}

                if (targetTpl) {
                    bannerCanvas.classList.add(targetTpl);
                }

                // 템플릿 A/B 모두 같은 렌더러를 쓰므로, 버튼 전환 직후 미리보기를 다시 그립니다.
                requestAnimationFrame(() => setTimeout(runLayoutEngine, 0));
            });
        });

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
                        const ratioHeightCalc = (targetWidth / highResCanvas.width) * highResCanvas.height;

                        // 스토리 모드는 9:16 비율을 강제해 1080x1920으로 고정,
                        // 그 외 모드는 계산값을 반올림하여 사용
                        let targetHeight = ratioHeightCalc;
                        if (currentMode === 'story') {
                            targetHeight = Math.round((targetWidth * 16) / 9);
                        } else {
                            targetHeight = Math.round(ratioHeightCalc);
                        }

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

                            // 스마트 파일명 자동 생성: YYMMDD_공고똑낙_feed/story.png
                            const now = new Date();
                            const yy = String(now.getFullYear()).slice(2);
                            const mm = String(now.getMonth() + 1).padStart(2, '0');
                            const dd = String(now.getDate()).padStart(2, '0');
                            const modeSuffix = currentMode === 'story' ? 'story' : 'feed';
                            link.download = `${yy}${mm}${dd}_공고뚝딱_${modeSuffix}.png`;
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

                // 디자인 및 표시 변경은 CSS(.edit-mode-active)로 자동 위임됨

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

                // 디자인 및 표시 변경은 CSS(.edit-mode-active)로 자동 위임됨

                if (sortableInstance) {
                    sortableInstance.option('disabled', true);
                }
            }
        });
    }

    // 항목 추가 동작 (편집 모드에서만 보임)
    if (addItemBtn && dynamicList && infoList) {
        addItemBtn.addEventListener('click', () => {
            // 남은 기본 항목을 찾아서 새 항목의 기본값으로 세팅
            const PRESET_ORDER = ['참여 대상', '진행 일시', '진행 장소', '참여 혜택', '신청 마감', '참가자 확정'];
            let nextPreset = '기타';
            for (const p of PRESET_ORDER) {
                let exists = false;
                document.querySelectorAll('.preset-title-select').forEach(sel => {
                    if (sel.value === p) exists = true;
                });
                if (!exists) {
                    nextPreset = p;
                    break;
                }
            }

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
                        <span class="display-title-text"></span>
                        <select class="preset-title-select dynamic-title-input">
                            <option value="참여 대상">참여 대상</option>
                            <option value="진행 일시">진행 일시</option>
                            <option value="진행 장소">진행 장소</option>
                            <option value="참여 혜택">참여 혜택</option>
                            <option value="신청 마감">신청 마감</option>
                            <option value="참가자 확정">참가자 확정</option>
                            <option value="기타">기타(직접 입력)</option>
                        </select>
                        <input type="text" class="custom-title-input dynamic-title-input" placeholder="항목명 입력">
                    </div>
                    <label class="highlight-toggle" title="강조 항목 지정">
                        <input type="checkbox" class="highlight-checkbox">
                        <span class="highlight-toggle-icon">★</span>
                    </label>
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
            // prepend(맨위) 유지
            dynamicList.prepend(listItem);
            infoList.prepend(dl);
            
            // 프리셋 기본값 지정
            const presetSelect = listItem.querySelector('.preset-title-select');
            if (presetSelect) presetSelect.value = nextPreset;

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

            // 강조 체크박스 연동
            const highlightCheckbox = listItem.querySelector('.highlight-checkbox');
            if (highlightCheckbox) {
                highlightCheckbox.addEventListener('change', () => {
                    applyHighlight(highlightCheckbox.checked ? dl.id : null);
                });
            }

            // 추가 시 제목 입력에 포커스
            titleInput.focus();
            initTitleDropdown(listItem.querySelector('.item-label-group'));
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

    // 정적 항목(HTML에 하드코딩된 항목)의 강조 체크박스 이벤트 등록
    document.querySelectorAll('.highlight-checkbox[data-preview-id]').forEach(cb => {
        cb.addEventListener('change', () => {
            applyHighlight(cb.checked ? cb.dataset.previewId : null);
        });
    });

    // ---------------------------------------------
    // 임시 저장 (LocalStorage) 구현
    // ---------------------------------------------
    const saveDataBtn = document.getElementById('save-data-btn');

    // 1. 임시 저장하기
    if (saveDataBtn) {
        saveDataBtn.addEventListener('click', () => {
            const data = {
                settings: {
                    titleLine1: inputs.titleLine1.value,
                    titleLine2: inputs.titleLine2.value,
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

                // Helper to get title (Select vs Custom)
                const presetSelect = item.querySelector('.preset-title-select');
                const customInput = item.querySelector('.custom-title-input');
                let finalTitle = '';
                let titlePreset = '';
                if (presetSelect) {
                    titlePreset = presetSelect.value;
                    finalTitle = (titlePreset === '기타' && customInput) ? customInput.value : titlePreset;
                } else {
                    const fallbackTitle = item.querySelector('.dynamic-title-input');
                    if (fallbackTitle) finalTitle = fallbackTitle.value;
                }

                if (id === 'editor-date') {
                    data.items.push({
                        id: id,
                        type: 'date',
                        titlePreset: titlePreset,
                        titleContent: finalTitle,
                        dateDate: document.getElementById('date-date').value,
                        dateTime: document.getElementById('date-time').value
                    });
                } else if (id === 'editor-target' || id === 'editor-location' || id === 'editor-benefit' || id === 'editor-deadline' || id === 'editor-announcement') {
                    // For static IDs, we also need to get the custom benefit if it's editor-benefit
                    const inputId = id.replace('editor-', '');
                    let finalContent = '';
                    let benefitPreset = '';
                    if (id === 'editor-benefit') {
                        const benSelect = document.getElementById('benefit');
                        const benCustom = document.getElementById('benefit-custom');
                        if (benSelect) {
                            benefitPreset = benSelect.value;
                            finalContent = (benefitPreset === '기타' && benCustom) ? benCustom.value : benefitPreset;
                        }
                    } else {
                        const el = document.getElementById(inputId);
                        if (el) finalContent = el.value;
                    }
                    data.items.push({
                        id: id,
                        type: 'static',
                        inputId: inputId,
                        titlePreset: titlePreset,
                        titleContent: finalTitle,
                        benefitPreset: benefitPreset,
                        content: finalContent
                    });
                } else {
                    // 동적으로 추가된 항목
                    const contentInput = item.querySelector('.dynamic-content-input');
                    data.items.push({
                        id: id,
                        type: 'dynamic',
                        titlePreset: titlePreset,
                        titleContent: finalTitle,
                        content: contentInput ? contentInput.value : ''
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
            inputs.titleLine1.value = data.settings.titleLine1 || data.settings.title || '';
            inputs.titleLine2.value = data.settings.titleLine2 || '';
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
                const domEl = existingDomItems[itemData.id];
                const prevEl = existingPreviewItems[itemData.id.replace('editor-', 'preview-dl-')];

                if (domEl) {
                    // Restore title dropdowns
                    const presetSelect = domEl.querySelector('.preset-title-select');
                    const customInput = domEl.querySelector('.custom-title-input');
                    if (presetSelect && itemData.titlePreset) {
                        presetSelect.value = itemData.titlePreset;
                        if (itemData.titlePreset === '기타' && customInput) {
                            customInput.value = itemData.titleContent;
                            customInput.classList.add('is-active');
                        }
                    } else if (presetSelect) {
                        // Fallback for old save structure
                        const oldTitle = itemData.title || itemData.titleContent || '';
                        let matched = false;
                        Array.from(presetSelect.options).forEach(opt => {
                            if (opt.value === oldTitle) matched = true;
                        });
                        
                        if (matched) {
                            presetSelect.value = oldTitle;
                            if (customInput) customInput.classList.remove('is-active');
                        } else {
                            presetSelect.value = '기타';
                            if (customInput) {
                                customInput.value = oldTitle;
                                customInput.classList.add('is-active');
                            }
                        }
                    }

                    if (itemData.type === 'date') {
                        domEl.querySelector('#date-date').value = itemData.dateDate;
                        domEl.querySelector('#date-time').value = itemData.dateTime;
                    } else if (itemData.type === 'static') {
                        if (itemData.inputId === 'benefit') {
                            const benSelect = document.getElementById('benefit');
                            const benCustom = document.getElementById('benefit-custom');
                            if (benSelect && itemData.benefitPreset !== undefined) {
                                benSelect.value = itemData.benefitPreset;
                                if (itemData.benefitPreset === '기타') {
                                    benCustom.value = itemData.content;
                                }
                            }
                        } else {
                            // [Vercel/동기화] setTimeout(0)으로 미루면 초기 runLayoutEngine(100ms)보다 늦게 값이 들어가
                            // '입력 안됨'·빈 미리보기가 남을 수 있어, DOM에 붙인 직후 동기로 값을 넣습니다.
                            const el = document.getElementById(itemData.inputId);
                            if (el) el.value = itemData.content;
                        }
                    } else if (itemData.type === 'dynamic') {
                        const contentInput = domEl.querySelector('.dynamic-content-input');
                        if (contentInput) contentInput.value = itemData.content;
                    }
                    dynamicList.appendChild(domEl);
                    if (prevEl) infoList.appendChild(prevEl);
                }
            });

            // Dispatch input/change events to refresh UI state immediately
            setTimeout(() => {
                document.querySelectorAll('input, select').forEach(el => {
                    if (el.tagName === 'SELECT') {
                        el.dispatchEvent(new Event('change'));
                    } else {
                        el.dispatchEvent(new Event('input'));
                    }
                });
                // [복구 후] data-initialized 때문에 initTitleDropdown이 다시 안 도는 경우 대비: dt/표시 라벨만 즉시 동기화
                document.querySelectorAll('.item-label-group').forEach(syncTitleDropdown);
                requestAnimationFrame(() => runLayoutEngine());
            }, 10);

        } catch (e) {
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

    // --- 3.0 NEW LOGIC ---
    // 1. 150-char MaxLength on all inputs
    document.querySelectorAll('.build-col-content input[type="text"], .build-col-content textarea').forEach(el => {
        if (!el.classList.contains('theme-color')) {
            el.maxLength = 150;
            // Prevent pasting large chunks
            el.addEventListener('input', (e) => {
                if (e.target.value.length > 150) {
                    alert('최대 150자까지만 입력 가능합니다.');
                    e.target.value = e.target.value.substring(0, 150);
                    // trigger further events
                    e.target.dispatchEvent(new Event('change'));
                }
            });
        }
    });

    // 2. Intelligent Auto-Shrink and ellipsis (Adaptive Font)
    const applyAdaptiveFont = (previewElement) => {
        if (!previewElement) return;
        requestAnimationFrame(() => {
            let minFontSize = 10;
            let currentSize = parseFloat(window.getComputedStyle(previewElement).fontSize) || 15;
            let defaultSize = previewElement.dataset.originalSize ? parseFloat(previewElement.dataset.originalSize) : currentSize;
            if (!previewElement.dataset.originalSize) previewElement.dataset.originalSize = defaultSize;

            previewElement.style.fontSize = defaultSize + 'px';
            previewElement.style.display = 'block';
            previewElement.style.webkitLineClamp = 'unset';
            previewElement.style.maxHeight = '4.5em';

            // While Overflowing
            while ((previewElement.scrollHeight > previewElement.clientHeight) && currentSize > minFontSize) {
                currentSize -= 1;
                previewElement.style.fontSize = currentSize + 'px';
            }

            // If still overflowing at minFontSize
            if (previewElement.scrollHeight > previewElement.clientHeight) {
                previewElement.style.display = '-webkit-box';
                previewElement.style.webkitLineClamp = '3';
                previewElement.style.webkitBoxOrient = 'vertical';
                previewElement.style.overflow = 'hidden';
                previewElement.style.textOverflow = 'ellipsis';
            }
        });
    };

    // Override existing updateText helper to also call auto shrink
    const originalUpdateText = updateText;
    updateText = (previewElement, value, defaultText) => {
        originalUpdateText(previewElement, value, defaultText);
        applyAdaptiveFont(previewElement);
    };

    // Observer to re-apply logic on any dom update in banner-content just in case
    const observer = new MutationObserver(() => {
        document.querySelectorAll('.info-list dd, .preview-title-line1, .preview-title-line2').forEach(applyAdaptiveFont);
    });
    observer.observe(document.querySelector('.banner-content'), { childList: true, subtree: true, characterData: true });

    // 3. Title Preset Dropdowns (Existing items)
    // syncTitleDropdown: dt 텍스트만 현재 값으로 동기화 (이벤트 리스너 등록 없음 - 탭 전환 시 사용)
    const syncTitleDropdown = (group) => {
        const select = group.querySelector('.preset-title-select');
        const customInput = group.querySelector('.custom-title-input');
        if (!select || !customInput) return;

        let previewDt;
        const dataFor = select.getAttribute('data-for');
        if (dataFor) {
            previewDt = document.getElementById('preview-dt-' + dataFor);
        } else {
            const listItemId = group.closest('.list-item').id;
            const dtId = listItemId.replace('editor-', 'preview-dl-');
            const previewDl = document.getElementById(dtId);
            if (previewDl) previewDt = previewDl.querySelector('dt');
        }

        if (!previewDt) return;
        const val = select.value;
        let currentTitle = val;
        if (val === '기타') {
            currentTitle = customInput.value.trim() || '입력 안됨';
        }
        if (previewDt) previewDt.textContent = currentTitle;
        const displaySpan = group.querySelector('.display-title-text');
        if (displaySpan) displaySpan.textContent = currentTitle;
    };

    // initTitleDropdown: 이벤트 리스너 등록 + 초기 동기화 (최초 1회만 호출)
    const initTitleDropdown = (group) => {
        const select = group.querySelector('.preset-title-select');
        const customInput = group.querySelector('.custom-title-input');
        if (!select || !customInput) return;

        // 이미 초기화된 그룹은 건너뜀 (중복 이벤트 방지)
        if (group.dataset.initialized) return;
        group.dataset.initialized = 'true';

        let previewDt;
        const dataFor = select.getAttribute('data-for');
        if (dataFor) {
            previewDt = document.getElementById('preview-dt-' + dataFor);
        } else {
            // For dynamically added items, finding the closest preview dt
            const listItemId = group.closest('.list-item').id;
            const dtId = listItemId.replace('editor-', 'preview-dl-');
            const previewDl = document.getElementById(dtId);
            if (previewDl) previewDt = previewDl.querySelector('dt');
        }

        const updateTitle = () => {
            const val = select.value;
            let currentTitle = val;

            if (val === '기타') {
                customInput.classList.add('is-active');
                currentTitle = customInput.value.trim() || '입력 안됨';
            } else {
                customInput.classList.remove('is-active');
            }

            if (previewDt) previewDt.textContent = currentTitle;
            
            const displaySpan = group.querySelector('.display-title-text');
            if (displaySpan) displaySpan.textContent = currentTitle;

            if (previewDt) applyAdaptiveFont(previewDt);
        };

        select.addEventListener('change', updateTitle);
        customInput.addEventListener('input', updateTitle);
        updateTitle();
    };
    document.querySelectorAll('.item-label-group').forEach(initTitleDropdown);

    // 4. Reward Image Mapping Logic
    const rewardImages = {
        '네이버페이 3천원(전원)': 'assets/images/Reward_naverpay_3000.png',
        '네이버페이 5천원(전원)': 'assets/images/Reward_naverpay_5000.png',
        '커리어톡 3천원(전원)': 'assets/images/Reward_careertalk_3000.png',
        '커리어톡 5천원(전원)': 'assets/images/Reward_careertalk_5000.png'
    };
    const benefitSelect = document.getElementById('benefit');
    const benefitCustom = document.getElementById('benefit-custom');
    const previewRewardImg = document.getElementById('preview-reward-img');
    const previewBenefitDd = document.getElementById('preview-benefit');

    if (benefitSelect && benefitCustom) {
        const updateReward = () => {
            const val = benefitSelect.value;
            if (val === '기타') {
                benefitCustom.style.display = 'block';
                previewRewardImg.style.display = 'none';
                updateText(previewBenefitDd, benefitCustom.value, '혜택 미정');
            } else if (val === '') {
                benefitCustom.style.display = 'none';
                previewRewardImg.style.display = 'none';
                updateText(previewBenefitDd, '', '');
            } else {
                benefitCustom.style.display = 'none';
                updateText(previewBenefitDd, val, '혜택 미정');
                if (rewardImages[val]) {
                    previewRewardImg.src = rewardImages[val];
                    previewRewardImg.style.display = 'block';
                } else {
                    previewRewardImg.style.display = 'none';
                }
            }
        };
        benefitSelect.addEventListener('change', updateReward);
        benefitCustom.addEventListener('input', updateReward);
        updateReward();
    }

    // ==========================================================
    // 🎯 지능형 레이아웃 엔진 v3.0
    //    Feed(1080×1350) / Story(1080×1920) 규격 엄격 관리
    // ==========================================================

    const CANVAS_NATIVE_WIDTH = 1080;
    const VIEW_SPECS = {
        feed: { px: 1350, label: '1350px', ratio: '4 / 5' },
        story: { px: 1920, label: '1920px', ratio: '9 / 16' }
    };

    // 타겟 픽셀 → 화면 렌더링 환산 비율 (canvas 표시 너비 기준)
    const getScaleRatio = () => {
        const renderedWidth = bannerCanvas.getBoundingClientRect().width;
        return renderedWidth / CANVAS_NATIVE_WIDTH;
    };

    let currentMode = 'feed';
    let targetPx = VIEW_SPECS.feed.px;

    /* ----- 원본(Initial) 값 캐시 ----- */
    const ORIGINAL = {
        titleFontSize: 36,       // px  (2.25rem ≈ 36px)
        titleFontSizeMin: 28,    // 48px 네이티브 → 스케일 반영 (실제 픽셀은 스케일 후 체크)
        dlPadding: 18,           // px  (1.125rem)
        dlPaddingMin: 6,         // px
        bannerPadding: 48,       // px  (3rem top/side)
        bannerPaddingMin: 20,    // px
        footerPadding: 48,       // px
        footerPaddingMin: 20,    // px
        bannerHeaderMargin: 40,  // px  (2.5rem)
        bannerHeaderMarginMin: 12,
        ddFontSize: 17,          // px  (1.0625rem)
        ddFontSizeMin: 10        // px
    };

    /* ----- UI 요소 참조 ----- */
    const canvasContainer = document.getElementById('canvas-container');
    const capacityBar = document.getElementById('capacity-bar');
    const overflowAlert = document.getElementById('overflow-alert');
    const overflowMsg = document.getElementById('overflow-alert-msg');
    const previewTitleLine1 = document.getElementById('preview-title-line1');
    const previewTitleLine2 = document.getElementById('preview-title-line2');
    const bannerContent = document.querySelector('.banner-content');
    const bannerFooter = document.querySelector('.banner-footer');
    const bannerHeader = document.querySelector('.banner-header');
    const infoListDls = () => document.querySelectorAll('.info-list dl');
    const infoListDds = () => document.querySelectorAll('.info-list dd');

    /**
     * Figma MCP 기준 4개 화면을 하나의 템플릿 레지스트리로 관리합니다.
     * - 템플릿 A/B를 같은 주입 방식으로 렌더링
     * - 피드/스토리 별 고정 네이티브 높이를 함께 관리
     * - 로고 자산도 템플릿 메타에서 결정
     */
    const TEMPLATE_REGISTRY = {
        'template-a:feed': {
            id: 'tpl-template-a-feed',
            nativeWidth: 1080,
            nativeHeight: 1350,
            logoSrc: 'assets/images/LOGO-20SLAB-Red.svg'
        },
        'template-a:story': {
            id: 'tpl-template-a-story',
            nativeWidth: 1080,
            nativeHeight: 1920,
            logoSrc: 'assets/images/LOGO-20SLAB-Red.svg'
        },
        'template-b:feed': {
            id: 'tpl-template-b-feed',
            nativeWidth: 1080,
            nativeHeight: 1350,
            logoSrc: 'assets/images/LOGO_20SLAB_white.png'
        },
        'template-b:story': {
            id: 'tpl-template-b-story',
            nativeWidth: 1080,
            nativeHeight: 1920,
            logoSrc: 'assets/images/LOGO-20SLAB-Red.svg'
        }
    };

    const getCurrentTemplateName = () =>
        bannerCanvas.classList.contains('template-b') ? 'template-b' : 'template-a';

    const getCurrentTemplateKey = () => `${getCurrentTemplateName()}:${currentMode}`;

    const getCurrentTemplateMeta = () => TEMPLATE_REGISTRY[getCurrentTemplateKey()] || null;

    const injectedTemplateMatchesKey = (wrapper, templateKey) => {
        if (!wrapper) return false;
        const root = wrapper.querySelector('[data-template-root]');
        return !!root && root.dataset.templateKey === templateKey;
    };

    const injectTemplateClone = (wrapper, templateKey) => {
        const meta = TEMPLATE_REGISTRY[templateKey];
        const tpl = meta ? document.getElementById(meta.id) : null;
        if (!tpl || !tpl.content) return false;
        wrapper.replaceChildren(tpl.content.cloneNode(true));
        return true;
    };

    const collectBannerData = () => {
        const previewNotice = document.getElementById('preview-notice');
        const items = Array.from(infoListDls()).map(dl => {
            const dt = dl.querySelector('dt');
            const dd = dl.querySelector('dd');
            const isDate = dl.id === 'preview-dl-date';

            return {
                id: dl.id,
                label: dt ? dt.textContent.trim() : '',
                type: isDate ? 'date' : 'text',
                highlight: dl.classList.contains('highlight-row'),
                value: isDate ? '' : (dd ? dd.textContent.trim() : ''),
                date: isDate ? (document.getElementById('preview-date-date')?.textContent.trim() || '') : '',
                time: isDate ? (document.getElementById('preview-date-time')?.textContent.trim() || '') : ''
            };
        });

        return {
            titleLine1: previewTitleLine1 ? previewTitleLine1.textContent.trim() : '',
            titleLine2: previewTitleLine2 ? previewTitleLine2.textContent.trim() : '',
            noticeHTML: previewNotice ? previewNotice.innerHTML : '',
            rewardImageVisible: !!previewRewardImg && previewRewardImg.style.display !== 'none' && !!previewRewardImg.getAttribute('src'),
            rewardImageSrc: previewRewardImg ? (previewRewardImg.getAttribute('src') || '') : '',
            items
        };
    };

    const createTextRow = (item, bannerData) => {
        const row = document.createElement('div');
        row.className = 'banner-info-row';

        const label = document.createElement('div');
        label.className = 'banner-info-row__label';
        label.textContent = item.label;

        const valueWrap = document.createElement('div');
        valueWrap.className = 'banner-info-row__value';

        const value = document.createElement('p');
        value.className = 'banner-info-row__text';
        value.textContent = item.value;
        valueWrap.appendChild(value);

        const isBenefitRow = item.id === 'preview-dl-benefit';
        if (isBenefitRow && bannerData?.rewardImageVisible && bannerData.rewardImageSrc) {
            row.classList.add('banner-info-row--with-reward');
            const rewardImg = document.createElement('img');
            rewardImg.className = 'banner-info-row__reward-image';
            rewardImg.src = bannerData.rewardImageSrc;
            rewardImg.alt = '참여 혜택 리워드 이미지';
            valueWrap.appendChild(rewardImg);
        }

        row.appendChild(label);
        row.appendChild(valueWrap);

        if (item.highlight) {
            row.classList.add('is-highlighted');
        }

        return row;
    };

    const createDateRow = (item) => {
        const row = document.createElement('div');
        row.className = 'banner-info-row banner-info-row--date';

        const label = document.createElement('div');
        label.className = 'banner-info-row__label';
        label.textContent = item.label;

        const valueWrap = document.createElement('div');
        valueWrap.className = 'banner-info-row__value';

        const dateLine = document.createElement('p');
        dateLine.className = 'banner-info-row__date-line banner-info-row__date-line--primary';
        dateLine.textContent = item.date;

        const timeLine = document.createElement('p');
        timeLine.className = 'banner-info-row__date-line banner-info-row__date-line--secondary';
        timeLine.textContent = item.time;

        valueWrap.appendChild(dateLine);
        valueWrap.appendChild(timeLine);
        row.appendChild(label);
        row.appendChild(valueWrap);

        if (item.highlight) {
            row.classList.add('is-highlighted');
        }

        return row;
    };

    const populateTemplate = (root, bannerData, meta) => {
        const title1 = root.querySelector('[data-field="title-line1"]');
        const title2 = root.querySelector('[data-field="title-line2"]');
        const notice = root.querySelector('[data-field="notice"]');
        const logo = root.querySelector('[data-field="logo"]');
        const itemsSlot = root.querySelector('[data-slot="items"]');

        if (title1) title1.textContent = bannerData.titleLine1;
        if (title2) title2.textContent = bannerData.titleLine2;
        if (notice) notice.innerHTML = bannerData.noticeHTML;
        if (logo) {
            logo.src = getEffectiveLogoSrc(meta.logoSrc);
            logo.alt = '대학내일20대연구소 로고';
        }

        if (itemsSlot) {
            const fragment = document.createDocumentFragment();
            bannerData.items.forEach(item => {
                fragment.appendChild(item.type === 'date' ? createDateRow(item) : createTextRow(item, bannerData));
            });
            itemsSlot.replaceChildren(fragment);
        }
    };

    const applyTemplateScale = (wrapper, root, meta) => {
        const currentWidth = bannerCanvas.clientWidth || 480;
        const scaleVal = currentWidth / meta.nativeWidth;

        wrapper.className = 'banner-template-host';
        wrapper.style.display = 'block';

        root.style.position = 'absolute';
        root.style.top = '0';
        root.style.left = '0';
        root.style.transformOrigin = 'top left';
        root.style.transform = `scale(${scaleVal})`;
        root.style.width = `${meta.nativeWidth}px`;
        root.style.height = `${meta.nativeHeight}px`;

        bannerCanvas.style.position = 'relative';
        bannerCanvas.style.height = `${meta.nativeHeight * scaleVal}px`;
    };

    /* ------------------------------------------------
       메인 최적화 루프 (단계별)
    ------------------------------------------------- */
    const runLayoutEngine = () => {
        if (!bannerCanvas || !bannerContent) return;

        // ── 모든 값을 최초값으로 리셋 ──
        if (previewTitleLine1) previewTitleLine1.style.fontSize = ORIGINAL.titleFontSize + 'px';
        if (previewTitleLine2) previewTitleLine2.style.fontSize = ORIGINAL.titleFontSize + 'px';

        // 인라인으로 오버라이드된 flex 및 정렬 속성 리셋 (CSS로 완벽히 위임)
        bannerContent.style.flex = '';
        const innerWrap = bannerCanvas.querySelector('.banner-inner-wrap');
        if (innerWrap) innerWrap.style.justifyContent = '';

        bannerContent.style.padding = `${ORIGINAL.bannerPadding}px`;
        bannerFooter.style.padding = `${ORIGINAL.footerPadding}px ${ORIGINAL.bannerPadding}px`;
        bannerHeader.style.marginBottom = ORIGINAL.bannerHeaderMargin + 'px';
        infoListDls().forEach(dl => {
            dl.style.paddingTop = ORIGINAL.dlPadding + 'px';
            dl.style.paddingBottom = ORIGINAL.dlPadding + 'px';
        });
        infoListDds().forEach(dd => dd.style.fontSize = '');

        // 현재 실제 콘텐츠 높이
        // story 모드: banner-content가 flex:none이라 bannerCanvas.scrollHeight가
        // 콘텐츠 크기만큼만 나옴. overflow 판정은 "콘텐츠가 컨테이너 안에 들어오는가"이므로
        // story에서는 bannerCanvas.scrollHeight(=콘텐츠 실제 높이)와 containerH를 비교
        const getCurrentH = () => bannerCanvas.scrollHeight;
        const containerH = canvasContainer.getBoundingClientRect().height;
        const targetRendered = containerH;

        // ── 1단계: 제목 폰트 축소 로직 비활성화 (크기 고정 요구사항) ──

        // ── 2단계: 간격/패딩 축소 ──
        if (getCurrentH() > targetRendered) {
            let dlPad = ORIGINAL.dlPadding;
            let contentPad = ORIGINAL.bannerPadding;
            let footerPad = ORIGINAL.footerPadding;
            let headerMb = ORIGINAL.bannerHeaderMargin;

            while (getCurrentH() > targetRendered &&
                (dlPad > ORIGINAL.dlPaddingMin ||
                    contentPad > ORIGINAL.bannerPaddingMin ||
                    headerMb > ORIGINAL.bannerHeaderMarginMin)) {

                if (dlPad > ORIGINAL.dlPaddingMin) {
                    dlPad = Math.max(ORIGINAL.dlPaddingMin, dlPad - 1);
                    infoListDls().forEach(dl => {
                        dl.style.paddingTop = dlPad + 'px';
                        dl.style.paddingBottom = dlPad + 'px';
                    });
                }
                if (contentPad > ORIGINAL.bannerPaddingMin) {
                    contentPad = Math.max(ORIGINAL.bannerPaddingMin, contentPad - 2);
                    bannerContent.style.padding = `${contentPad}px`;
                }
                if (footerPad > ORIGINAL.footerPaddingMin) {
                    footerPad = Math.max(ORIGINAL.footerPaddingMin, footerPad - 2);
                    bannerFooter.style.padding = `${footerPad}px ${contentPad}px`;
                }
                if (headerMb > ORIGINAL.bannerHeaderMarginMin) {
                    headerMb = Math.max(ORIGINAL.bannerHeaderMarginMin, headerMb - 1);
                    bannerHeader.style.marginBottom = headerMb + 'px';
                }
            }
        }

        // ── 3단계: 본문 폰트 축소 로직 비활성화 (결과물 일관성) ──

        // ── 용량 게이지 & 경고 업데이트 ──
        const finalH = getCurrentH();
        let ratio = Math.min((finalH / targetRendered) * 100, 120);
        let isOver = finalH > targetRendered + 1;

        // Locofy 구동 등 특정 디자인 모드에서는 absolute scale이 스크롤 높이를 비틀어버리므로 오버플로우 검사를 건너뜀
        const capacityBarWrapper = document.querySelector('.capacity-bar-wrapper');
        const currentTemplateMeta = getCurrentTemplateMeta();
        if (currentTemplateMeta) {
            isOver = false;
            if (capacityBarWrapper) capacityBarWrapper.style.display = 'none';
        } else {
            if (capacityBarWrapper) capacityBarWrapper.style.display = 'block';
        }

        if (capacityBar) {
            capacityBar.style.width = Math.min(ratio, 100) + '%';
            capacityBar.classList.toggle('is-over', isOver);
        }

        if (overflowAlert) {
            if (isOver) {
                overflowMsg.textContent =
                    `콘텐츠가 규격(${VIEW_SPECS[currentMode].label})을 초과했습니다. 내용을 줄여주세요!`;
                overflowAlert.classList.add('is-visible');
                // 모든 편집 인풋에 빨간 테두리 강조
                document.querySelectorAll(
                    '.build-col-content input[type="text"], .build-col-content textarea, .build-col-content select'
                ).forEach(el => el.classList.add('input-overflow-warning'));
            } else {
                overflowAlert.classList.remove('is-visible');
                document.querySelectorAll('.input-overflow-warning')
                    .forEach(el => el.classList.remove('input-overflow-warning'));
            }
        }
        
        const syncTemplateRender = () => {
            const templateRenderWrapper = document.getElementById('template-render-wrapper');
            const standardWrapper = document.getElementById('banner-content-wrapper');
            if (!templateRenderWrapper || !standardWrapper) return;

            const templateKey = getCurrentTemplateKey();
            const meta = TEMPLATE_REGISTRY[templateKey];

            if (!meta) {
                standardWrapper.style.display = '';
                templateRenderWrapper.style.display = 'none';
                templateRenderWrapper.replaceChildren();
                templateRenderWrapper.dataset.activeKey = '';
                templateRenderWrapper.className = '';
                bannerCanvas.style.height = '';
                bannerCanvas.style.position = '';
                return;
            }

            const mustReloadTemplate =
                templateRenderWrapper.dataset.activeKey !== templateKey ||
                !injectedTemplateMatchesKey(templateRenderWrapper, templateKey);

            if (mustReloadTemplate) {
                const injected = injectTemplateClone(templateRenderWrapper, templateKey);
                if (!injected) {
                    templateRenderWrapper.dataset.activeKey = '';
                    console.warn('[Template] 템플릿을 찾지 못했습니다. key=', templateKey);
                    return;
                }
            }

            standardWrapper.style.display = 'none';
            templateRenderWrapper.dataset.activeKey = templateKey;

            const root = templateRenderWrapper.querySelector('[data-template-root]');
            if (!root) return;

            populateTemplate(root, collectBannerData(), meta);
            applyTemplateScale(templateRenderWrapper, root, meta);
        };

        syncTemplateRender();

    };

    const restoreLastViewState = () => {
        try {
            const lastTemplate = sessionStorage.getItem(LAST_STATE_KEYS.template);
            const lastMode = sessionStorage.getItem(LAST_STATE_KEYS.mode);

            if (lastTemplate) {
                const tplBtnToActivate = document.querySelector(`.tpl-btn[data-tpl="${lastTemplate}"]`);
                if (tplBtnToActivate) {
                    tplBtnToActivate.click();
                }
            }

            if (lastMode) {
                const tabToActivate = document.querySelector(`.view-tab[data-mode="${lastMode}"]`);
                if (tabToActivate) {
                    tabToActivate.click();
                }
            }
        } catch (_) {
            // 세션 스토리지가 없거나 접근 불가한 경우 무시
        }
    };

    /* ----- 뷰탭 전환 로직 (기존 탭과 통합) ----- */
    const viewTabs = document.querySelectorAll('.view-tab');
    viewTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            viewTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            currentMode = tab.dataset.mode || 'feed';
            targetPx = VIEW_SPECS[currentMode].px;

            try {
                sessionStorage.setItem(LAST_STATE_KEYS.mode, currentMode);
            } catch (_) {}

            // canvas-container 비율 전환
            if (canvasContainer) {
                canvasContainer.classList.toggle('view-story', currentMode === 'story');
            }
            // 스토리 모드: banner-canvas에 story-centered 클래스 토글
            if (bannerCanvas) {
                bannerCanvas.classList.toggle('story-centered', currentMode === 'story');
            }

            // 인라인 정렬 스타일 초기화 (전환 시 CSS의 story-centered 규칙을 통해 자동 적용됨)
            const innerWrap = bannerCanvas.querySelector('.banner-inner-wrap');
            if (innerWrap) {
                innerWrap.style.justifyContent = '';
            }
            // 레이아웃 엔진 재실행 (비율 변경 후 repaint 대기)
            // 탭 전환 후 dt 텍스트 동기화 (이벤트 재등록 없이 값만 갱신)
            requestAnimationFrame(() => {
                document.querySelectorAll('.item-label-group').forEach(syncTitleDropdown);
                setTimeout(runLayoutEngine, 50);
            });
        });
    });

    /* ----- 모든 편집 입력에 엔진 트리거 연동 ----- */
    const triggerEngine = () => requestAnimationFrame(runLayoutEngine);

    // 기존 폼 인풋
    document.querySelectorAll(
        '#banner-form input, #banner-form textarea, #banner-form select'
    ).forEach(el => {
        el.addEventListener('input', triggerEngine);
        el.addEventListener('change', triggerEngine);
    });

    // 동적 항목 추가/삭제 감지용 MutationObserver (infoList)
    if (infoList) {
        new MutationObserver(triggerEngine).observe(infoList, { childList: true, subtree: true });
    }

    // 초기 1회 실행 (로딩 완료 후)
    requestAnimationFrame(() => {
        restoreLastViewState();
        setTimeout(runLayoutEngine, 100);
    });

    // 윈도우 리사이즈 시 재실행
    window.addEventListener('resize', triggerEngine);

});