/* ============================================
   LCARS Template Library
   Pre-built layouts at various screen sizes
   ============================================
   All coordinates snap to a 10px grid.
   Adjacent same-color elements share exact edges
   so fills appear contiguous with no gaps.
   ============================================ */

const LCARS_TEMPLATES = [

    // ─── Small TFT (280×240) ─────────────
    {
        name: 'Status Panel',
        description: 'System status with sidebar and readouts',
        size: '280×240',
        category: 'Small TFT',
        data: {
            display: { width: 280, height: 240, cornerRadius: 20, bgColor: '#000000' },
            elements: [
                // Frame — elbow-tl + top bar share edge at x=100; elbow-tl + left bar share edge at y=50
                { id: 1, type: 'elbow-tl', name: 'Top Left Elbow', props: { x: 0, y: 0, w: 100, h: 50, color: '#CC99CC', barW: 30, barH: 20, outerR: 20, innerR: 10, bottomGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 2, type: 'bar-horizontal', name: 'Top Bar', props: { x: 100, y: 0, w: 180, h: 20, color: '#CC99CC', endCapLeft: 'flat', endCapRight: 'flat' }, visible: true, locked: false },
                { id: 3, type: 'elbow-bl', name: 'Bottom Left Elbow', props: { x: 0, y: 190, w: 100, h: 50, color: '#9977AA', barW: 30, barH: 20, outerR: 20, innerR: 10, topGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 4, type: 'bar-horizontal', name: 'Bottom Bar', props: { x: 100, y: 220, w: 180, h: 20, color: '#9977AA', endCapLeft: 'flat', endCapRight: 'flat' }, visible: true, locked: false },
                { id: 5, type: 'bar-vertical', name: 'Left Sidebar', props: { x: 0, y: 50, w: 30, h: 140, color: '#FFCC66', endCapTop: 'flat', endCapBottom: 'flat' }, visible: true, locked: false },
                // Content
                { id: 6, type: 'text-label', name: 'Title', props: { x: 40, y: 30, w: 230, h: 20, color: '#FF9900', text: 'SYSTEM STATUS', fontSize: 16, fontWeight: 'bold', textAlign: 'left' }, visible: true, locked: false },
                { id: 7, type: 'data-readout', name: 'CPU', props: { x: 40, y: 60, w: 230, h: 30, label: 'CPU', value: '72%', labelColor: '#FFCC66', valueColor: '#FFCC66', labelFontSize: 10, valueFontSize: 14, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 8, type: 'data-readout', name: 'MEM', props: { x: 40, y: 100, w: 230, h: 30, label: 'MEM', value: '4.2 GB', labelColor: '#FFCC66', valueColor: '#FFCC66', labelFontSize: 10, valueFontSize: 14, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 9, type: 'data-readout', name: 'NET', props: { x: 40, y: 140, w: 230, h: 30, label: 'NET', value: '1.4 MB/s', labelColor: '#FFCC66', valueColor: '#FFCC66', labelFontSize: 10, valueFontSize: 14, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 10, type: 'status-row', name: 'Status Indicators', props: { x: 40, y: 180, w: 230, h: 10, colors: ['#99CCFF', '#CC99CC', '#99CCFF', '#FFCC66', '#99CCFF', '#99CCFF'], gap: 4, shape: 'square' }, visible: true, locked: false },
            ]
        }
    },

    {
        name: 'Menu Screen',
        description: 'Navigation menu with pill buttons',
        size: '280×240',
        category: 'Small TFT',
        data: {
            display: { width: 280, height: 240, cornerRadius: 20, bgColor: '#000000' },
            elements: [
                // Frame — single elbow + sidebar
                { id: 1, type: 'elbow-tl', name: 'Top Left', props: { x: 0, y: 0, w: 100, h: 40, color: '#FF9900', barW: 20, barH: 20, outerR: 20, innerR: 10, bottomGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 2, type: 'bar-horizontal', name: 'Top Bar', props: { x: 100, y: 0, w: 180, h: 20, color: '#FF9900', endCapLeft: 'flat', endCapRight: 'flat' }, visible: true, locked: false },
                { id: 3, type: 'bar-vertical', name: 'Left Sidebar', props: { x: 0, y: 40, w: 20, h: 200, color: '#FFCC66', endCapTop: 'flat', endCapBottom: 'flat' }, visible: true, locked: false },
                // Content
                { id: 4, type: 'text-label', name: 'Title', props: { x: 30, y: 20, w: 240, h: 20, color: '#FF9900', text: 'MAIN MENU', fontSize: 16, fontWeight: 'bold', textAlign: 'left' }, visible: true, locked: false },
                { id: 5, type: 'button-pill', name: 'Nav 1', props: { x: 30, y: 50, w: 240, h: 30, color: '#CC99CC', label: 'NAVIGATION', fontSize: 13, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 6, type: 'button-pill', name: 'Nav 2', props: { x: 30, y: 90, w: 240, h: 30, color: '#9977AA', label: 'COMMUNICATIONS', fontSize: 13, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 7, type: 'button-pill', name: 'Nav 3', props: { x: 30, y: 130, w: 240, h: 30, color: '#FFCC66', label: 'ENGINEERING', fontSize: 13, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 8, type: 'button-pill', name: 'Nav 4', props: { x: 30, y: 170, w: 240, h: 30, color: '#99CCFF', label: 'SCIENCE', fontSize: 13, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 9, type: 'button-pill', name: 'Nav 5', props: { x: 30, y: 210, w: 240, h: 30, color: '#CC6699', label: 'TACTICAL', fontSize: 13, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
            ]
        }
    },

    // ─── Medium TFT (320×240) ─────────────
    {
        name: 'Dashboard',
        description: 'Data dashboard with full elbow frame',
        size: '320×240',
        category: 'Medium TFT',
        data: {
            display: { width: 320, height: 240, cornerRadius: 20, bgColor: '#000000' },
            elements: [
                // Full frame — 4 elbows + bridge bars + sidebars
                { id: 1, type: 'elbow-tl', name: 'Top Left', props: { x: 0, y: 0, w: 110, h: 50, color: '#FF9900', barW: 30, barH: 20, outerR: 20, innerR: 10, bottomGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 2, type: 'elbow-tr', name: 'Top Right', props: { x: 210, y: 0, w: 110, h: 50, color: '#FFCC66', barW: 30, barH: 20, outerR: 20, innerR: 10, bottomGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 3, type: 'bar-horizontal', name: 'Top Bridge', props: { x: 110, y: 0, w: 100, h: 20, color: '#CC99CC', endCapLeft: 'flat', endCapRight: 'flat' }, visible: true, locked: false },
                { id: 4, type: 'elbow-bl', name: 'Bottom Left', props: { x: 0, y: 190, w: 110, h: 50, color: '#FF9900', barW: 30, barH: 20, outerR: 20, innerR: 10, topGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 5, type: 'elbow-br', name: 'Bottom Right', props: { x: 210, y: 190, w: 110, h: 50, color: '#FFCC66', barW: 30, barH: 20, outerR: 20, innerR: 10, topGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 6, type: 'bar-horizontal', name: 'Bottom Bridge', props: { x: 110, y: 220, w: 100, h: 20, color: '#CC99CC', endCapLeft: 'flat', endCapRight: 'flat' }, visible: true, locked: false },
                { id: 7, type: 'bar-vertical', name: 'Left Sidebar', props: { x: 0, y: 50, w: 30, h: 140, color: '#FFCC66', endCapTop: 'flat', endCapBottom: 'flat' }, visible: true, locked: false },
                { id: 8, type: 'bar-vertical', name: 'Right Sidebar', props: { x: 290, y: 50, w: 30, h: 140, color: '#FF9900', endCapTop: 'flat', endCapBottom: 'flat' }, visible: true, locked: false },
                // Content
                { id: 9, type: 'text-label', name: 'Title', props: { x: 40, y: 30, w: 240, h: 20, color: '#FF9900', text: 'SENSOR ANALYSIS', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }, visible: true, locked: false },
                { id: 10, type: 'data-readout', name: 'Temp', props: { x: 40, y: 60, w: 240, h: 30, label: 'TEMP', value: '23.4°C', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 9, valueFontSize: 14, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 11, type: 'data-readout', name: 'Pressure', props: { x: 40, y: 100, w: 240, h: 30, label: 'PRES', value: '1013 hPa', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 9, valueFontSize: 14, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 12, type: 'progress-bar', name: 'Power Level', props: { x: 40, y: 140, w: 240, h: 20, fillPercent: 78, fillColor: '#FFCC00', bgColor: '#222222', capLeft: 'round', capRight: 'round' }, visible: true, locked: false },
                { id: 13, type: 'status-row', name: 'Subsystems', props: { x: 40, y: 170, w: 240, h: 10, colors: ['#99CCFF', '#CC99CC', '#FFCC66', '#99CCFF', '#99CCFF'], gap: 4, shape: 'square' }, visible: true, locked: false },
            ]
        }
    },

    // ─── Large TFT (480×320) ─────────────
    {
        name: 'Control Panel',
        description: 'Sidebar menu with data panel',
        size: '480×320',
        category: 'Large TFT',
        data: {
            display: { width: 480, height: 320, cornerRadius: 20, bgColor: '#000000' },
            elements: [
                // Frame — L-frame with top + bottom bars
                { id: 1, type: 'elbow-tl', name: 'Top Left', props: { x: 0, y: 0, w: 140, h: 60, color: '#CC99CC', barW: 40, barH: 30, outerR: 30, innerR: 10, bottomGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 2, type: 'bar-horizontal', name: 'Top Bar', props: { x: 140, y: 0, w: 340, h: 30, color: '#CC99CC', endCapLeft: 'flat', endCapRight: 'flat' }, visible: true, locked: false },
                { id: 3, type: 'elbow-bl', name: 'Bottom Left', props: { x: 0, y: 260, w: 140, h: 60, color: '#9977AA', barW: 40, barH: 30, outerR: 30, innerR: 10, topGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 4, type: 'bar-horizontal', name: 'Bottom Bar', props: { x: 140, y: 290, w: 340, h: 30, color: '#9977AA', endCapLeft: 'flat', endCapRight: 'flat' }, visible: true, locked: false },
                { id: 5, type: 'bar-vertical', name: 'Left Sidebar', props: { x: 0, y: 60, w: 40, h: 200, color: '#FFCC66', endCapTop: 'flat', endCapBottom: 'flat' }, visible: true, locked: false },
                // Content — left column (buttons), right column (data)
                { id: 6, type: 'title-bar', name: 'Title', props: { x: 50, y: 30, w: 420, h: 20, text: 'ENGINEERING SYSTEMS', color: '#FF9900', fontSize: 15, textAlign: 'center', underline: true, underlineColor: '#FF9900', bgColor: '', bgHeight: 2 }, visible: true, locked: false },
                { id: 7, type: 'button-pill', name: 'Btn 1', props: { x: 50, y: 60, w: 190, h: 30, color: '#FFCC66', label: 'POWER SYSTEMS', fontSize: 13, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 8, type: 'button-pill', name: 'Btn 2', props: { x: 50, y: 100, w: 190, h: 30, color: '#CC99CC', label: 'LIFE SUPPORT', fontSize: 13, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 9, type: 'button-pill', name: 'Btn 3', props: { x: 50, y: 140, w: 190, h: 30, color: '#99CCFF', label: 'PROPULSION', fontSize: 13, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 10, type: 'button-pill', name: 'Btn 4', props: { x: 50, y: 180, w: 190, h: 30, color: '#FFCC66', label: 'STRUCTURAL', fontSize: 13, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 11, type: 'button-pill', name: 'Btn 5', props: { x: 50, y: 220, w: 190, h: 30, color: '#CC6699', label: 'DIAGNOSTICS', fontSize: 13, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 12, type: 'data-readout', name: 'Warp', props: { x: 250, y: 60, w: 220, h: 30, label: 'WARP', value: 'ONLINE', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 10, valueFontSize: 14, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 13, type: 'data-readout', name: 'Impulse', props: { x: 250, y: 100, w: 220, h: 30, label: 'IMPULSE', value: 'STANDBY', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 10, valueFontSize: 14, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 14, type: 'progress-bar', name: 'Power', props: { x: 250, y: 140, w: 220, h: 20, fillPercent: 85, fillColor: '#FFCC00', bgColor: '#222222', capLeft: 'round', capRight: 'round' }, visible: true, locked: false },
                { id: 15, type: 'status-row', name: 'Systems', props: { x: 250, y: 170, w: 220, h: 20, colors: ['#99CCFF', '#CC99CC', '#FFCC66', '#99CCFF', '#99CCFF', '#CC6699', '#99CCFF', '#FFCC66'], gap: 4, shape: 'square' }, visible: true, locked: false },
            ]
        }
    },

    // ─── Portrait TFT (320×480) ─────────────
    {
        name: 'Vertical Display',
        description: 'Portrait layout with stacked sections',
        size: '320×480',
        category: 'Portrait TFT',
        data: {
            display: { width: 320, height: 480, cornerRadius: 20, bgColor: '#000000' },
            elements: [
                // Full frame — 4 elbows
                { id: 1, type: 'elbow-tl', name: 'Top Left', props: { x: 0, y: 0, w: 120, h: 50, color: '#FF9900', barW: 30, barH: 20, outerR: 20, innerR: 10, bottomGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 2, type: 'elbow-tr', name: 'Top Right', props: { x: 200, y: 0, w: 120, h: 50, color: '#FFCC66', barW: 30, barH: 20, outerR: 20, innerR: 10, bottomGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 3, type: 'bar-horizontal', name: 'Top Bridge', props: { x: 120, y: 0, w: 80, h: 20, color: '#CC99CC', endCapLeft: 'flat', endCapRight: 'flat' }, visible: true, locked: false },
                { id: 4, type: 'bar-vertical', name: 'Left Sidebar', props: { x: 0, y: 50, w: 30, h: 380, color: '#FFCC66', endCapTop: 'flat', endCapBottom: 'flat' }, visible: true, locked: false },
                { id: 5, type: 'bar-vertical', name: 'Right Sidebar', props: { x: 290, y: 50, w: 30, h: 380, color: '#FF9900', endCapTop: 'flat', endCapBottom: 'flat' }, visible: true, locked: false },
                { id: 6, type: 'elbow-bl', name: 'Bottom Left', props: { x: 0, y: 430, w: 120, h: 50, color: '#FF9900', barW: 30, barH: 20, outerR: 20, innerR: 10, topGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 7, type: 'elbow-br', name: 'Bottom Right', props: { x: 200, y: 430, w: 120, h: 50, color: '#FFCC66', barW: 30, barH: 20, outerR: 20, innerR: 10, topGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 8, type: 'bar-horizontal', name: 'Bottom Bridge', props: { x: 120, y: 460, w: 80, h: 20, color: '#CC99CC', endCapLeft: 'flat', endCapRight: 'flat' }, visible: true, locked: false },
                // Content
                { id: 9, type: 'text-label', name: 'Header', props: { x: 40, y: 30, w: 240, h: 20, color: '#FF9900', text: 'OPERATIONS', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }, visible: true, locked: false },
                { id: 10, type: 'data-readout', name: 'Data 1', props: { x: 40, y: 60, w: 240, h: 30, label: 'CORE', value: 'NOMINAL', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 9, valueFontSize: 14, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 11, type: 'data-readout', name: 'Data 2', props: { x: 40, y: 100, w: 240, h: 30, label: 'FIELD', value: '47.3 T', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 9, valueFontSize: 14, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 12, type: 'data-readout', name: 'Data 3', props: { x: 40, y: 140, w: 240, h: 30, label: 'FLUX', value: '12.8%', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 9, valueFontSize: 14, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 13, type: 'bar-horizontal', name: 'Section Divider', props: { x: 40, y: 180, w: 240, h: 10, color: '#FF9900', endCapLeft: 'flat', endCapRight: 'flat' }, visible: true, locked: false },
                { id: 14, type: 'button-pill', name: 'Action 1', props: { x: 40, y: 200, w: 240, h: 30, color: '#CC99CC', label: 'PRIMARY SYSTEMS', fontSize: 13, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 15, type: 'button-pill', name: 'Action 2', props: { x: 40, y: 240, w: 240, h: 30, color: '#9977AA', label: 'SECONDARY SYSTEMS', fontSize: 13, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 16, type: 'button-pill', name: 'Action 3', props: { x: 40, y: 280, w: 240, h: 30, color: '#FFCC66', label: 'AUX CONTROLS', fontSize: 13, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 17, type: 'button-pill', name: 'Action 4', props: { x: 40, y: 320, w: 240, h: 30, color: '#99CCFF', label: 'SENSORS', fontSize: 13, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 18, type: 'progress-bar', name: 'Power', props: { x: 40, y: 360, w: 240, h: 20, fillPercent: 64, fillColor: '#FFCC00', bgColor: '#222222', capLeft: 'round', capRight: 'round' }, visible: true, locked: false },
                { id: 19, type: 'status-row', name: 'Status', props: { x: 40, y: 390, w: 240, h: 10, colors: ['#CC6699', '#CC99CC', '#CC6699', '#FFCC66', '#CC6699', '#CC6699', '#99CCFF', '#CC6699'], gap: 4, shape: 'square' }, visible: true, locked: false },
            ]
        }
    },

    // ─── Small OLED (128×160) ─────────────
    {
        name: 'Micro Display',
        description: 'Compact layout for small screens',
        size: '128×160',
        category: 'Small OLED',
        data: {
            display: { width: 128, height: 160, cornerRadius: 10, bgColor: '#000000' },
            elements: [
                // Minimal L-frame
                { id: 1, type: 'elbow-tl', name: 'Top Corner', props: { x: 0, y: 0, w: 60, h: 30, color: '#FF9900', barW: 20, barH: 10, outerR: 10, innerR: 10, bottomGap: 0, label: '', labelColor: '#000000', labelFontSize: 8 }, visible: true, locked: false },
                { id: 2, type: 'bar-horizontal', name: 'Top Bar', props: { x: 60, y: 0, w: 60, h: 10, color: '#FFCC66', endCapLeft: 'flat', endCapRight: 'flat' }, visible: true, locked: false },
                { id: 3, type: 'bar-vertical', name: 'Left Bar', props: { x: 0, y: 30, w: 20, h: 130, color: '#CC99CC', endCapTop: 'flat', endCapBottom: 'flat' }, visible: true, locked: false },
                // Content
                { id: 4, type: 'text-label', name: 'Title', props: { x: 30, y: 10, w: 90, h: 20, color: '#FF9900', text: 'STATUS', fontSize: 10, fontWeight: 'bold', textAlign: 'left' }, visible: true, locked: false },
                { id: 5, type: 'data-readout', name: 'Line 1', props: { x: 30, y: 40, w: 90, h: 20, label: 'T', value: '23°', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 7, valueFontSize: 10, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 6, type: 'data-readout', name: 'Line 2', props: { x: 30, y: 70, w: 90, h: 20, label: 'H', value: '45%', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 7, valueFontSize: 10, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 7, type: 'data-readout', name: 'Line 3', props: { x: 30, y: 100, w: 90, h: 20, label: 'P', value: '1013', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 7, valueFontSize: 10, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 8, type: 'status-row', name: 'Status', props: { x: 30, y: 130, w: 90, h: 10, colors: ['#FFCC66', '#CC99CC', '#FFCC66', '#99CCFF', '#FFCC66'], gap: 2, shape: 'square' }, visible: true, locked: false },
                { id: 9, type: 'text-label', name: 'Footer', props: { x: 30, y: 140, w: 90, h: 20, color: '#999999', text: 'NCC-1701', fontSize: 9, fontWeight: 'normal', textAlign: 'center' }, visible: true, locked: false },
            ]
        }
    },

    // ─── Web (800×480) ─────────────
    {
        name: 'Wide Panel',
        description: 'Widescreen layout with dual sidebars',
        size: '800×480',
        category: 'Web',
        data: {
            display: { width: 800, height: 480, cornerRadius: 30, bgColor: '#000000' },
            elements: [
                // Full frame — 4 elbows + bridge bars + sidebars
                { id: 1, type: 'elbow-tl', name: 'Top Left', props: { x: 0, y: 0, w: 160, h: 70, color: '#CC99CC', barW: 50, barH: 30, outerR: 30, innerR: 10, bottomGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 2, type: 'elbow-tr', name: 'Top Right', props: { x: 640, y: 0, w: 160, h: 70, color: '#9977AA', barW: 50, barH: 30, outerR: 30, innerR: 10, bottomGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 3, type: 'bar-horizontal', name: 'Top Bridge', props: { x: 160, y: 0, w: 480, h: 30, color: '#FFCC66', endCapLeft: 'flat', endCapRight: 'flat' }, visible: true, locked: false },
                { id: 4, type: 'elbow-bl', name: 'Bottom Left', props: { x: 0, y: 410, w: 160, h: 70, color: '#CC99CC', barW: 50, barH: 30, outerR: 30, innerR: 10, topGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 5, type: 'elbow-br', name: 'Bottom Right', props: { x: 640, y: 410, w: 160, h: 70, color: '#9977AA', barW: 50, barH: 30, outerR: 30, innerR: 10, topGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 6, type: 'bar-horizontal', name: 'Bottom Bridge', props: { x: 160, y: 450, w: 480, h: 30, color: '#FFCC66', endCapLeft: 'flat', endCapRight: 'flat' }, visible: true, locked: false },
                { id: 7, type: 'bar-vertical', name: 'Left Sidebar', props: { x: 0, y: 70, w: 50, h: 340, color: '#FFCC66', endCapTop: 'flat', endCapBottom: 'flat' }, visible: true, locked: false },
                { id: 8, type: 'bar-vertical', name: 'Right Sidebar', props: { x: 750, y: 70, w: 50, h: 340, color: '#FFCC66', endCapTop: 'flat', endCapBottom: 'flat' }, visible: true, locked: false },
                // Content
                { id: 9, type: 'title-bar', name: 'Title', props: { x: 60, y: 40, w: 680, h: 20, text: 'STARSHIP OPERATIONS', color: '#FF9900', fontSize: 18, textAlign: 'center', underline: true, underlineColor: '#FF9900', bgColor: '', bgHeight: 2 }, visible: true, locked: false },
                { id: 10, type: 'button-pill', name: 'Nav 1', props: { x: 60, y: 70, w: 220, h: 40, color: '#CC99CC', label: 'HELM CONTROL', fontSize: 15, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 11, type: 'button-pill', name: 'Nav 2', props: { x: 60, y: 120, w: 220, h: 40, color: '#9977AA', label: 'TACTICAL', fontSize: 15, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 12, type: 'button-pill', name: 'Nav 3', props: { x: 60, y: 170, w: 220, h: 40, color: '#FFCC66', label: 'SCIENCE', fontSize: 15, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 13, type: 'button-pill', name: 'Nav 4', props: { x: 60, y: 220, w: 220, h: 40, color: '#99CCFF', label: 'ENGINEERING', fontSize: 15, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 14, type: 'button-pill', name: 'Nav 5', props: { x: 60, y: 270, w: 220, h: 40, color: '#CC6699', label: 'MEDICAL', fontSize: 15, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 15, type: 'data-readout', name: 'Data 1', props: { x: 290, y: 70, w: 440, h: 40, label: 'WARP CORE', value: 'NOMINAL', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 11, valueFontSize: 16, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 16, type: 'data-readout', name: 'Data 2', props: { x: 290, y: 120, w: 440, h: 40, label: 'SHIELDS', value: '100%', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 11, valueFontSize: 16, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 17, type: 'data-readout', name: 'Data 3', props: { x: 290, y: 170, w: 440, h: 40, label: 'WEAPONS', value: 'ARMED', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 11, valueFontSize: 16, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 18, type: 'progress-bar', name: 'Power', props: { x: 290, y: 220, w: 440, h: 30, fillPercent: 92, fillColor: '#FFCC00', bgColor: '#222222', capLeft: 'round', capRight: 'round' }, visible: true, locked: false },
                { id: 19, type: 'status-row', name: 'Subsystems', props: { x: 290, y: 260, w: 440, h: 20, colors: ['#99CCFF', '#CC99CC', '#FFCC66', '#99CCFF', '#99CCFF', '#CC6699', '#99CCFF', '#FFCC66', '#CC99CC', '#99CCFF', '#99CCFF', '#FFCC66'], gap: 6, shape: 'square' }, visible: true, locked: false },
            ]
        }
    },

    // ─── Web (1024×600) ─────────────
    {
        name: 'Kiosk Display',
        description: 'Information kiosk with inner panels',
        size: '1024×600',
        category: 'Web',
        data: {
            display: { width: 1024, height: 600, cornerRadius: 30, bgColor: '#000000' },
            elements: [
                // L-frame
                { id: 1, type: 'elbow-tl', name: 'Top Left', props: { x: 0, y: 0, w: 200, h: 80, color: '#FF9900', barW: 60, barH: 30, outerR: 30, innerR: 10, bottomGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 2, type: 'bar-horizontal', name: 'Top Bar', props: { x: 200, y: 0, w: 830, h: 30, color: '#FFCC66', endCapLeft: 'flat', endCapRight: 'flat' }, visible: true, locked: false },
                { id: 3, type: 'elbow-bl', name: 'Bottom Left', props: { x: 0, y: 520, w: 200, h: 80, color: '#FF9900', barW: 60, barH: 30, outerR: 30, innerR: 10, topGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 4, type: 'bar-horizontal', name: 'Bottom Bar', props: { x: 200, y: 570, w: 830, h: 30, color: '#FFCC66', endCapLeft: 'flat', endCapRight: 'flat' }, visible: true, locked: false },
                { id: 5, type: 'bar-vertical', name: 'Left Sidebar', props: { x: 0, y: 80, w: 60, h: 440, color: '#CC99CC', endCapTop: 'flat', endCapBottom: 'flat' }, visible: true, locked: false },
                // Content
                { id: 6, type: 'title-bar', name: 'Title', props: { x: 70, y: 40, w: 940, h: 30, text: 'FEDERATION DATABASE', color: '#FF9900', fontSize: 20, textAlign: 'center', underline: true, underlineColor: '#FF9900', bgColor: '', bgHeight: 2 }, visible: true, locked: false },
                { id: 7, type: 'inner-panel', name: 'Left Panel', props: { x: 70, y: 80, w: 430, h: 420, bgColor: '#222222', borderColor: '#FF9900', borderWidth: 2, borderRadius: 10, headerText: '', headerColor: '#FF9900', headerFontSize: 8 }, visible: true, locked: false },
                { id: 8, type: 'inner-panel', name: 'Right Panel', props: { x: 510, y: 80, w: 440, h: 420, bgColor: '#222222', borderColor: '#FFCC66', borderWidth: 2, borderRadius: 10, headerText: '', headerColor: '#FFCC66', headerFontSize: 8 }, visible: true, locked: false },
                { id: 9, type: 'text-label', name: 'Panel 1 Label', props: { x: 80, y: 90, w: 410, h: 20, color: '#FF9900', text: 'CREW MANIFEST', fontSize: 16, fontWeight: 'bold', textAlign: 'left' }, visible: true, locked: false },
                { id: 10, type: 'text-label', name: 'Panel 2 Label', props: { x: 520, y: 90, w: 420, h: 20, color: '#FFCC66', text: 'SHIP SYSTEMS', fontSize: 16, fontWeight: 'bold', textAlign: 'left' }, visible: true, locked: false },
                { id: 11, type: 'button-pill', name: 'Entry 1', props: { x: 80, y: 120, w: 410, h: 40, color: '#CC99CC', label: 'COMMAND STAFF', fontSize: 14, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 12, type: 'button-pill', name: 'Entry 2', props: { x: 80, y: 170, w: 410, h: 40, color: '#9977AA', label: 'BRIDGE CREW', fontSize: 14, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 13, type: 'button-pill', name: 'Entry 3', props: { x: 80, y: 220, w: 410, h: 40, color: '#FFCC66', label: 'ENGINEERING', fontSize: 14, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 14, type: 'button-pill', name: 'Entry 4', props: { x: 80, y: 270, w: 410, h: 40, color: '#99CCFF', label: 'SCIENCE DIVISION', fontSize: 14, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 15, type: 'button-pill', name: 'Entry 5', props: { x: 80, y: 320, w: 410, h: 40, color: '#CC6699', label: 'MEDICAL', fontSize: 14, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 16, type: 'data-readout', name: 'Sys 1', props: { x: 520, y: 120, w: 420, h: 40, label: 'WARP DRIVE', value: 'ONLINE', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 11, valueFontSize: 16, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 17, type: 'data-readout', name: 'Sys 2', props: { x: 520, y: 170, w: 420, h: 40, label: 'IMPULSE', value: 'STANDBY', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 11, valueFontSize: 16, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 18, type: 'data-readout', name: 'Sys 3', props: { x: 520, y: 220, w: 420, h: 40, label: 'DEFLECTORS', value: 'NOMINAL', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 11, valueFontSize: 16, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 19, type: 'data-readout', name: 'Sys 4', props: { x: 520, y: 270, w: 420, h: 40, label: 'LIFE SUPPORT', value: 'OPTIMAL', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 11, valueFontSize: 16, bgColor: '#111111', borderColor: '' }, visible: true, locked: false },
                { id: 20, type: 'progress-bar', name: 'Energy', props: { x: 520, y: 320, w: 420, h: 30, fillPercent: 88, fillColor: '#FFCC00', bgColor: '#222222', capLeft: 'round', capRight: 'round' }, visible: true, locked: false },
                { id: 21, type: 'status-row', name: 'Deck Status', props: { x: 520, y: 360, w: 420, h: 20, colors: ['#CC99CC', '#99CCFF', '#FFCC66', '#CC99CC', '#CC99CC', '#FF9900', '#CC99CC', '#99CCFF', '#CC99CC', '#FFCC66', '#CC99CC', '#CC99CC', '#CC6699', '#CC99CC', '#99CCFF', '#CC99CC'], gap: 6, shape: 'square' }, visible: true, locked: false },
            ]
        }
    },

    // ─── Web (1920×1080) ─────────────
    {
        name: 'Full HD Display',
        description: 'Full HD bridge display with three panels',
        size: '1920×1080',
        category: 'Web',
        data: {
            display: { width: 1920, height: 1080, cornerRadius: 40, bgColor: '#000000' },
            elements: [
                // Full frame — 4 elbows + bridge bars + sidebars
                { id: 1, type: 'elbow-tl', name: 'Top Left', props: { x: 0, y: 0, w: 300, h: 110, color: '#CC99CC', barW: 80, barH: 50, outerR: 50, innerR: 20, bottomGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 2, type: 'elbow-tr', name: 'Top Right', props: { x: 1620, y: 0, w: 300, h: 110, color: '#9977AA', barW: 80, barH: 50, outerR: 50, innerR: 20, bottomGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 3, type: 'bar-horizontal', name: 'Top Bridge', props: { x: 300, y: 0, w: 1320, h: 50, color: '#FFCC66', endCapLeft: 'flat', endCapRight: 'flat' }, visible: true, locked: false },
                { id: 4, type: 'elbow-bl', name: 'Bottom Left', props: { x: 0, y: 970, w: 300, h: 110, color: '#CC99CC', barW: 80, barH: 50, outerR: 50, innerR: 20, topGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 5, type: 'elbow-br', name: 'Bottom Right', props: { x: 1620, y: 970, w: 300, h: 110, color: '#9977AA', barW: 80, barH: 50, outerR: 50, innerR: 20, topGap: 0, label: '', labelColor: '#000000', labelFontSize: 10 }, visible: true, locked: false },
                { id: 6, type: 'bar-horizontal', name: 'Bottom Bridge', props: { x: 300, y: 1030, w: 1320, h: 50, color: '#FFCC66', endCapLeft: 'flat', endCapRight: 'flat' }, visible: true, locked: false },
                { id: 7, type: 'bar-vertical', name: 'Left Sidebar', props: { x: 0, y: 110, w: 80, h: 860, color: '#FFCC66', endCapTop: 'flat', endCapBottom: 'flat' }, visible: true, locked: false },
                { id: 8, type: 'bar-vertical', name: 'Right Sidebar', props: { x: 1840, y: 110, w: 80, h: 860, color: '#FFCC66', endCapTop: 'flat', endCapBottom: 'flat' }, visible: true, locked: false },
                // Title
                { id: 9, type: 'title-bar', name: 'Main Title', props: { x: 100, y: 60, w: 1720, h: 40, text: 'USS ENTERPRISE  ·  NCC-1701-D  ·  BRIDGE OPERATIONS', color: '#FF9900', fontSize: 26, textAlign: 'center', underline: true, underlineColor: '#FF9900', bgColor: '', bgHeight: 2 }, visible: true, locked: false },
                // Three inner panels
                { id: 10, type: 'inner-panel', name: 'Left Panel', props: { x: 100, y: 120, w: 400, h: 830, bgColor: '#111111', borderColor: '#FF9900', borderWidth: 2, borderRadius: 10, headerText: '', headerColor: '#FF9900', headerFontSize: 8 }, visible: true, locked: false },
                { id: 11, type: 'inner-panel', name: 'Center Panel', props: { x: 510, y: 120, w: 900, h: 830, bgColor: '#111111', borderColor: '#FFCC66', borderWidth: 2, borderRadius: 10, headerText: '', headerColor: '#FFCC66', headerFontSize: 8 }, visible: true, locked: false },
                { id: 12, type: 'inner-panel', name: 'Right Panel', props: { x: 1420, y: 120, w: 400, h: 830, bgColor: '#111111', borderColor: '#CC99CC', borderWidth: 2, borderRadius: 10, headerText: '', headerColor: '#CC99CC', headerFontSize: 8 }, visible: true, locked: false },
                // Left panel content — Navigation
                { id: 13, type: 'text-label', name: 'Nav Title', props: { x: 110, y: 140, w: 380, h: 30, color: '#FF9900', text: 'NAVIGATION', fontSize: 20, fontWeight: 'bold', textAlign: 'left' }, visible: true, locked: false },
                { id: 14, type: 'button-pill', name: 'Nav 1', props: { x: 110, y: 180, w: 380, h: 50, color: '#CC99CC', label: 'COURSE HEADING', fontSize: 16, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 15, type: 'button-pill', name: 'Nav 2', props: { x: 110, y: 240, w: 380, h: 50, color: '#9977AA', label: 'WARP TRAJECTORY', fontSize: 16, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 16, type: 'button-pill', name: 'Nav 3', props: { x: 110, y: 300, w: 380, h: 50, color: '#FFCC66', label: 'STAR CHARTS', fontSize: 16, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 17, type: 'button-pill', name: 'Nav 4', props: { x: 110, y: 360, w: 380, h: 50, color: '#99CCFF', label: 'SUBSPACE BEACONS', fontSize: 16, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                // Center panel content — Main Viewer
                { id: 18, type: 'text-label', name: 'Viewer Title', props: { x: 520, y: 140, w: 880, h: 30, color: '#FFCC66', text: 'MAIN VIEWER', fontSize: 20, fontWeight: 'bold', textAlign: 'center' }, visible: true, locked: false },
                { id: 19, type: 'data-readout', name: 'Heading', props: { x: 520, y: 180, w: 880, h: 40, label: 'HEADING', value: '142 MARK 7', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 13, valueFontSize: 18, bgColor: '#0a0a0a', borderColor: '' }, visible: true, locked: false },
                { id: 20, type: 'data-readout', name: 'Velocity', props: { x: 520, y: 230, w: 880, h: 40, label: 'VELOCITY', value: 'WARP 6.2', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 13, valueFontSize: 18, bgColor: '#0a0a0a', borderColor: '' }, visible: true, locked: false },
                { id: 21, type: 'data-readout', name: 'ETA', props: { x: 520, y: 280, w: 880, h: 40, label: 'ETA', value: '4 DAYS 7 HOURS', labelColor: '#99CCFF', valueColor: '#99CCFF', labelFontSize: 13, valueFontSize: 18, bgColor: '#0a0a0a', borderColor: '' }, visible: true, locked: false },
                { id: 22, type: 'progress-bar', name: 'Warp Power', props: { x: 520, y: 340, w: 880, h: 30, fillPercent: 78, fillColor: '#FFCC00', bgColor: '#222222', capLeft: 'round', capRight: 'round' }, visible: true, locked: false },
                { id: 23, type: 'status-row', name: 'Ship Systems', props: { x: 520, y: 380, w: 880, h: 30, colors: ['#CC99CC', '#99CCFF', '#FFCC66', '#CC99CC', '#CC99CC', '#FF9900', '#CC99CC', '#99CCFF', '#CC6699', '#CC99CC', '#FFCC66', '#CC99CC', '#CC99CC', '#99CCFF', '#CC99CC', '#FF9900', '#CC99CC', '#FFCC66', '#99CCFF', '#CC99CC'], gap: 8, shape: 'square' }, visible: true, locked: false },
                // Right panel content — Tactical
                { id: 24, type: 'text-label', name: 'Tac Title', props: { x: 1430, y: 140, w: 380, h: 30, color: '#CC99CC', text: 'TACTICAL', fontSize: 20, fontWeight: 'bold', textAlign: 'left' }, visible: true, locked: false },
                { id: 25, type: 'button-pill', name: 'Tac 1', props: { x: 1430, y: 180, w: 380, h: 50, color: '#CC6699', label: 'PHASERS', fontSize: 16, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 26, type: 'button-pill', name: 'Tac 2', props: { x: 1430, y: 240, w: 380, h: 50, color: '#CC6666', label: 'TORPEDOES', fontSize: 16, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 27, type: 'button-pill', name: 'Tac 3', props: { x: 1430, y: 300, w: 380, h: 50, color: '#FFCC66', label: 'SHIELDS', fontSize: 16, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
                { id: 28, type: 'button-pill', name: 'Tac 4', props: { x: 1430, y: 360, w: 380, h: 50, color: '#99CCFF', label: 'SENSORS', fontSize: 16, textColor: '#000000', textAlign: 'right' }, visible: true, locked: false },
            ]
        }
    },
];

// Screen size presets (no elements, just canvas dimensions)
const LCARS_SCREEN_PRESETS = [
    { name: '128×160',   width: 128,  height: 160,  category: 'Small OLED' },
    { name: '240×240',   width: 240,  height: 240,  category: 'Small TFT' },
    { name: '280×240',   width: 280,  height: 240,  category: 'Small TFT' },
    { name: '320×240',   width: 320,  height: 240,  category: 'Medium TFT' },
    { name: '480×320',   width: 480,  height: 320,  category: 'Large TFT' },
    { name: '320×480',   width: 320,  height: 480,  category: 'Portrait TFT' },
    { name: '800×480',   width: 800,  height: 480,  category: 'Web' },
    { name: '1024×600',  width: 1024, height: 600,  category: 'Web' },
    { name: '1920×1080', width: 1920, height: 1080, category: 'Web' },
];
