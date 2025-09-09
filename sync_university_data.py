#!/usr/bin/env python3
"""
大学数据同步脚本
从 backend/config/university_tiers.json 提取所有大学名称，
并同步到其他相关文件中
"""

import json
import os
from pathlib import Path
from typing import List, Set

def load_university_tiers() -> dict:
    """加载大学层级数据"""
    config_path = Path("backend/config/university_tiers.json")
    if not config_path.exists():
        raise FileNotFoundError(f"找不到配置文件: {config_path}")
    
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_all_universities(tier_data: dict) -> List[str]:
    """从层级数据中提取所有大学名称"""
    all_universities = set()
    
    university_tiers = tier_data.get("university_tiers", {})
    for tier, universities in university_tiers.items():
        for university in universities:
            all_universities.add(university)
    
    # 转换为排序后的列表
    return sorted(list(all_universities))

def load_existing_universities_from_processed_data() -> List[str]:
    """从 processed_universities.json 加载现有的大学名称"""
    processed_path = Path("data/processed_universities.json")
    if not processed_path.exists():
        print(f"警告: 找不到文件 {processed_path}")
        return []
    
    with open(processed_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 提取所有大学名称
    universities = [item["name"] for item in data if "name" in item]
    return sorted(universities)

def merge_university_lists(tier_universities: List[str], processed_universities: List[str]) -> List[str]:
    """合并两个大学列表，去重并排序"""
    all_universities = set(tier_universities + processed_universities)
    return sorted(list(all_universities))

def update_frontend_data_file(file_path: Path, universities: List[str]):
    """更新前端数据文件"""
    if not file_path.exists():
        print(f"警告: 文件不存在 {file_path}")
        return
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 更新大学列表
    data["universities"] = universities
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✓ 已更新 {file_path} ({len(universities)} 所大学)")

def update_radar_scoring_service(universities_by_tier: dict):
    """更新 radar_scoring_service.py 中的硬编码大学数据"""
    service_path = Path("backend/services/radar_scoring_service.py")
    if not service_path.exists():
        print(f"警告: 文件不存在 {service_path}")
        return
    
    with open(service_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 构建新的大学层级数据
    tier_0_unis = universities_by_tier.get("Tier 0", [])
    tier_1_unis = universities_by_tier.get("Tier 1", [])
    
    # 找到并替换 tier_0 的大学列表
    tier_0_pattern = r'("tier_0":\s*{\s*"score_range":\s*\([^)]+\),\s*"universities":\s*)\[[^\]]*\]'
    tier_0_replacement = f'\\1{json.dumps(tier_0_unis, ensure_ascii=False)}'
    
    # 找到并替换 tier_1 的大学列表
    tier_1_pattern = r'("tier_1":\s*{\s*"score_range":\s*\([^)]+\),\s*"universities":\s*)\[[^\]]*\]'
    tier_1_replacement = f'\\1{json.dumps(tier_1_unis, ensure_ascii=False)}'
    
    import re
    content = re.sub(tier_0_pattern, tier_0_replacement, content, flags=re.DOTALL)
    content = re.sub(tier_1_pattern, tier_1_replacement, content, flags=re.DOTALL)
    
    with open(service_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ 已更新 {service_path}")

def main():
    """主函数"""
    print("开始同步大学数据...")
    
    try:
        # 1. 加载大学层级数据
        tier_data = load_university_tiers()
        tier_universities = extract_all_universities(tier_data)
        print(f"从 university_tiers.json 提取到 {len(tier_universities)} 所大学")
        
        # 2. 加载现有的处理过的大学数据
        processed_universities = load_existing_universities_from_processed_data()
        print(f"从 processed_universities.json 加载到 {len(processed_universities)} 所大学")
        
        # 3. 合并大学列表
        all_universities = merge_university_lists(tier_universities, processed_universities)
        print(f"合并后共有 {len(all_universities)} 所大学")
        
        # 4. 更新前端数据文件
        frontend_files = [
            Path("data/frontend_data.json"),
            Path("frontend/public/data/frontend_data.json"),
            Path("frontend/src/data/frontend_data.json")
        ]
        
        for file_path in frontend_files:
            update_frontend_data_file(file_path, all_universities)
        
        # 5. 更新后端服务文件
        update_radar_scoring_service(tier_data.get("university_tiers", {}))
        
        print("\n✅ 大学数据同步完成!")
        print(f"总共同步了 {len(all_universities)} 所大学到相关文件")
        
    except Exception as e:
        print(f"❌ 同步过程中出现错误: {str(e)}")
        raise

if __name__ == "__main__":
    main()
