import styles from '../styles/Spinner.module.css';
import React, {useEffect, useState, useCallback} from "react";

const Spinner = () => {
  const [loading, setLoading] = useState(true);
  
  // 路線轉盤狀態
  const [lineData, setLineData] = useState({});
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  
  // 車站轉盤狀態
  const [stations, setStations] = useState([]);
  const [stationRotation, setStationRotation] = useState(0);
  const [isStationSpinning, setIsStationSpinning] = useState(false);

  // 選中狀態
  const [selectedLineIndex, setSelectedLineIndex] = useState(null);
  const [selectedStationIndex, setSelectedStationIndex] = useState(null); 

  useEffect(() => {
    fetch('http://localhost:8080/api/spinnerLine/getAll')
      .then(res => res.json())
      .then(json => {
        setLineData(json);
        setLoading(false);
      })
      .catch(err => console.error("Error:", err));
  }, []);

  // 路線轉盤轉完後的處理
  const fetchStations = (finalRotation) => {
    const entries = Object.entries(lineData);
    const entriesCount = entries.length;
    // 1. 取得 0~359 度的旋轉值
    const normalizedRotation = (finalRotation % 360);
    // 2. 計算指針相對於圓盤內部座標的角度位置
    let pointerAtDegree = (180 - normalizedRotation) % 360 + 180;
    // 3. 計算索引
    const sliceDegree = 360 / entriesCount;
    // 加上極小偏移量防止浮點數誤差，並確保索引在範圍內
    const selectedIndex = Math.floor((pointerAtDegree + 0.0001) / sliceDegree) % entriesCount;

    setSelectedLineIndex(selectedIndex);

    const [key, lineName] = entries[selectedIndex];

    console.log({
      "最終旋轉角度": normalizedRotation,
      "指針指向圓盤的角度": pointerAtDegree,
      "計算出的索引": selectedIndex,
      "選中線路": lineName
    });

    fetch(`http://localhost:8080/api/spinnerStation/getAll?lineName=${encodeURIComponent(lineName)}`)
      .then(res => res.json())
      .then(data => {
        setStationRotation(0);
        setStations(data);
      })
      .catch(err => console.error("Fetch Station Error:", err));
  };
  
  const handleLineSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSelectedLineIndex(null);
    setSelectedStationIndex(null); 
    const extraDegree = Math.floor(Math.random() * 360) + 1800; 
    const nextRotation = rotation + extraDegree;
    setRotation(nextRotation);
    setTimeout(() => {
      setIsSpinning(false);
      fetchStations(nextRotation);
      playLineSound();
    }, 2000);
  };

  const handleStationSpin = () => {
    if (isStationSpinning || stations.length === 0) return;
    setSelectedStationIndex(null);
    setIsStationSpinning(true);
    const extraDegree = Math.floor(Math.random() * 360) + 1800;
    const nextRotation = stationRotation + extraDegree;
    setStationRotation(nextRotation);
    setTimeout(() => { 
      setIsStationSpinning(false); 
      // 計算車站轉盤的選中索引
      const totalSlices = stations.length;
      const normalizedRotation = (nextRotation % 360);
      let pointerAtDegree = (180 - normalizedRotation) % 360 + 180;
      const sliceDegree = 360 / totalSlices;
      const selectedIndex = Math.floor((pointerAtDegree + 0.0001) / sliceDegree) % totalSlices;
      setSelectedStationIndex(selectedIndex);
      playStationSound();
    }, 2000);
  };

  const getMtrColor = (key) => {
    const mtrColors = {
      kwunTong: '#00ab4e',            // 觀塘線
      tsuenWan: '#f62e21',            // 荃灣線
      hongKongIsland: '#007cc3',      // 港島線
      southHongKongIsland: '#b5bd00', // 南港島線
      tseungKwanO: '#a35eb5',         // 將軍澳線
      tungChung: '#f38b00',           // 東涌線
      disneyland: '#f550a1',          // 迪士尼線
      eastRail: '#54bceb',            // 東鐵線
      tuenMa: '#9a3820',              // 屯馬線
      airportExpress: '#00888a'       // 機場快線
    };
    return mtrColors[key] || '#cccccc';
  };

  // 播放路線音效
  const playLineSound = useCallback(() => {
    const audio = new Audio('/sounds/coin_5.mp3');
    audio.play().catch(error => console.error("路線音效播放失敗:", error));
  }, []);

  // 播放車站音效
  const playStationSound = useCallback(() => {
    const audio = new Audio('/sounds/doraemon.mp3');
    audio.play().catch(error => console.error("車站音效播放失敗:", error));
  }, []);

  if (loading) return <div>載入中...</div>;

  return (
    <div className={styles.container}>
      
      {/* 轉盤一：線路選擇 */}
      <div className={styles.spinnerWrapper}>
        <h3>1. 選擇路線</h3>
        <div className={styles.spinnerContainer}>
          <svg viewBox="-1 -1 2 2" className={styles.svgRoot}>
            <g 
              className={styles.wheelGroup}
              style={{ transform: `rotate(${rotation - 90}deg)` }}
            >
              {Object.entries(lineData).map(([key, label], index, arr) => {
                const slice = 1 / arr.length;
                const startRad = 2 * Math.PI * (index * slice);
                const endRad = 2 * Math.PI * ((index + 1) * slice);
                const midRad = (startRad + endRad) / 2;
                const pathData = `M ${Math.cos(startRad)} ${Math.sin(startRad)} A 1 1 0 0 1 ${Math.cos(endRad)} ${Math.sin(endRad)} L 0 0`;
                const tx = Math.cos(midRad) * 0.75;
                const ty = Math.sin(midRad) * 0.75;
                const isSelected = selectedLineIndex === index;
                const opacity = (selectedLineIndex !== null && !isSpinning && !isSelected) ? 0.3 : 1;

                return (
                  <g key={key} style={{ opacity, transition: 'opacity 0.5s' }}>
                    <path d={pathData} fill={getMtrColor(key)} stroke="#fff" strokeWidth="0.005" />
                    <text x={tx} y={ty} fill="white" fontSize="0.09" alignmentBaseline="middle" className={styles.counterRotateText}
                      style={{ 
                        transform: `rotate(${-rotation + 90}deg)`, 
                        transformOrigin: `${tx}px ${ty}px` 
                      }}>
                      {label}
                    </text>
                  </g>
                );
              })}
            </g>
            <circle cx="0" cy="0" r="0.4" onClick={handleLineSpin} className={`${styles.centerButton} ${isSpinning ? styles.centerButtonDisabled : ""}`} />
            <text x="0" y="0.01" fontSize="0.10" className={styles.buttonText}>
              {isSpinning ? '...' : '點我開始'}
            </text>
            <polygon points="0,1.0 -0.04,1.1 0.04,1.1" fill="#FF4500" transform="rotate(180)" />
          </svg>
        </div>
      </div>

      {/* 轉盤二：車站選擇（當 stations 有資料時顯示） */}
      <div className={styles.spinnerWrapper} 
        style={{ opacity: stations.length > 0 ? 1 : 0.3 }}>
        <h3>2. 選擇車站</h3>
        <div className={styles.spinnerContainer}>
          {stations.length > 0 ? (
            <svg viewBox="-1 -1 2 2" className={styles.svgRoot}>
              <g className={styles.wheelGroup}
                style={{ transform: `rotate(${stationRotation - 90}deg)` }}
              >
                {stations.map((st, index) => {
                  const slice = 1 / stations.length;
                  const startRad = 2 * Math.PI * (index * slice);
                  const endRad = 2 * Math.PI * ((index + 1) * slice);
                  const midRad = (startRad + endRad) / 2;
                  const pathData = `M ${Math.cos(startRad)} ${Math.sin(startRad)} A 1 1 0 0 1 ${Math.cos(endRad)} ${Math.sin(endRad)} L 0 0`;
                  const tx = Math.cos(midRad) * 0.85;
                  const ty = Math.sin(midRad) * 0.85;
                  const isSelected = selectedStationIndex === index;
                  const opacity = (selectedStationIndex !== null && !isStationSpinning && !isSelected) ? 0.2 : 1;

                  return (
                    <g key={index} style={{ opacity, transition: 'opacity 0.5s' }}>
                      <path d={pathData} fill={index % 2 === 0 ? '#D9C5B2' : '#BFA18A'} stroke="#fff" strokeWidth="0.005" />
                      <text x={tx} y={ty} fill="#1A2B3C" fontSize="0.07" className={styles.counterRotateText}
                        style={{ 
                          transform: `rotate(${-stationRotation + 90}deg)`, 
                          transformOrigin: `${tx}px ${ty}px` 
                        }}>
                        {st.stationChineseName}
                      </text>
                    </g>
                  );
                })}
              </g>
              <circle cx="0" cy="0" r="0.4" onClick={handleStationSpin} className={`${styles.centerButton} ${isStationSpinning ? styles.centerButtonDisabled : ""}`} />
              <text x="0" y="0.01" fontSize="0.10" className={styles.buttonText}>
                {isStationSpinning ? '...' : '真妮去哪兒?'}
              </text>
              <polygon points="0,1.0 -0.04,1.1 0.04,1.1" fill="#FF4500" transform="rotate(180)" />
            </svg>
          ) : (
            <div className={styles.emptyPlaceholder}>
              請先轉動左側路線
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Spinner;