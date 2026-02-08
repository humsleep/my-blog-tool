#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
네이버 검색광고 API를 사용한 키워드 검색량 조회 및 블로그 제목 추천 도구
월간총검색수와제목.py

사용법:
    python 월간총검색수와제목.py "검색할 키워드"
    python 월간총검색수와제목.py "꽃배달,flower,화환"
"""

import hashlib
import hmac
import base64
import time
import requests
import json
import sys
from urllib.parse import quote
from datetime import datetime
import os
import csv
import random

# pandas가 없을 경우를 대비한 대체 함수들
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    print("pandas가 설치되지 않았습니다. CSV 파일로 저장합니다.")

# 네이버 검색 API 클라이언트 정보 (문서수 검색용)
NAVER_CLIENT_ID = "tth9fnsKBgcMDWVf96EV"
NAVER_CLIENT_SECRET = "tgW9pUVIRc"

class NaverSearchAdAPI:
    """네이버 검색광고 API 클라이언트"""
    
    def __init__(self, api_key, secret_key, customer_id):
        self.api_key = api_key
        self.secret_key = secret_key
        self.customer_id = customer_id
        self.base_url = "https://api.searchad.naver.com"
        
    def generate_signature(self, timestamp, method, uri):
        """HMAC-SHA256 서명 생성"""
        message = f"{timestamp}.{method}.{uri}"
        signature = hmac.new(
            self.secret_key.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()
        return base64.b64encode(signature).decode('utf-8')
    
    def get_headers(self, method, uri):
        """API 요청 헤더 생성"""
        timestamp = str(int(time.time() * 1000))
        signature = self.generate_signature(timestamp, method, uri)
        
        return {
            'X-Timestamp': timestamp,
            'X-API-KEY': self.api_key,
            'X-Customer': str(self.customer_id),
            'X-Signature': signature,
            'Content-Type': 'application/json'
        }
    
    def search_keywords(self, hint_keywords, show_detail=1):
        """키워드 도구 API를 사용한 관련 키워드 검색"""
        uri = "/keywordstool"
        
        # 쿼리 파라미터 설정
        params = {
            'hintKeywords': hint_keywords,
            'showDetail': show_detail
        }
        
        # URL 인코딩
        query_string = '&'.join([f"{k}={quote(str(v))}" for k, v in params.items()])
        full_uri = f"{uri}?{query_string}"
        
        headers = self.get_headers('GET', uri)
        url = f"{self.base_url}{full_uri}"
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API 요청 오류: {e}")
            return None

def search_document_count(keyword):
    """
    네이버 검색 API를 사용하여 키워드의 블로그 문서수를 검색합니다.
    
    Args:
        keyword (str): 검색할 키워드
        
    Returns:
        int: 블로그 문서 수 (실패시 0)
    """
    import urllib.request
    import urllib.parse
    import json
    
    # 키워드를 URL 인코딩
    encText = urllib.parse.quote(keyword)
    
    # 블로그 카테고리만 검색
    try:
        # 네이버 검색 API URL (블로그 검색)
        url = f"https://openapi.naver.com/v1/search/blog?query=" + encText
        
        # 요청 객체 생성
        request = urllib.request.Request(url)
        request.add_header("X-Naver-Client-Id", NAVER_CLIENT_ID)
        request.add_header("X-Naver-Client-Secret", NAVER_CLIENT_SECRET)
        
        # API 요청 실행
        response = urllib.request.urlopen(request)
        rescode = response.getcode()
        
        if rescode == 200:
            response_body = response.read()
            result = response_body.decode('utf-8')
            
            # JSON 응답을 파싱하여 총 문서 수 추출
            try:
                data = json.loads(result)
                blog_count = data.get('total', 0)
                return blog_count
            except json.JSONDecodeError:
                return 0
        else:
            return 0
            
    except Exception:
        return 0

def generate_blog_titles(keyword, search_volume, competition_ratio):
    """
    키워드 기반으로 네이버 블로그에 적합한 제목 5개를 생성합니다.
    
    Args:
        keyword (str): 키워드
        search_volume (int): 월간 검색량
        competition_ratio (float): 경쟁율
        
    Returns:
        list: 제목 5개 리스트
    """
    
    # 2024년 최신 트렌드에 맞는 제목 템플릿들
    title_templates = [
        # 호기심 유발형
        f"🔥 {keyword} 완벽 가이드 - 이거 하나면 끝!",
        f"✨ {keyword} 비밀 공개 - 99%가 모르는 진실",
        f"💡 {keyword} 꿀팁 - 전문가도 놀란 노하우",
        f"🎯 {keyword} 완전정복 - 초보자도 OK!",
        f"🚀 {keyword} 마스터하기 - 단계별 가이드",
        
        # 숫자 활용형
        f"📊 {keyword} TOP 10 - 2024년 최신 순위",
        f"🎪 {keyword} 5가지 방법 - 실패 없는 선택",
        f"📈 {keyword} 3단계 완성 - 누구나 따라하기",
        f"🎨 {keyword} 7가지 스타일 - 취향별 추천",
        f"⚡ {keyword} 1분 완성 - 초간단 방법",
        
        # 감정 어필형
        f"😍 {keyword} 완전 만족 - 후기 모음집",
        f"🤩 {keyword} 대박 후기 - 실제 경험담",
        f"😊 {keyword} 행복한 선택 - 만족도 100%",
        f"🥰 {keyword} 추천 이유 - 왜 이걸 선택했을까?",
        f"😎 {keyword} 고수 되기 - 프로의 비밀",
        
        # 비교/대조형
        f"⚖️ {keyword} vs 대안 - 어떤 게 더 좋을까?",
        f"🔄 {keyword} 전후 비교 - 놀라운 변화",
        f"📊 {keyword} 장단점 분석 - 솔직한 리뷰",
        f"🎯 {keyword} 선택 기준 - 이것만 알면 OK",
        f"💯 {keyword} 완벽 비교 - 최종 선택 가이드",
        
        # 시간/시기 활용형
        f"⏰ {keyword} 지금이 기회 - 타이밍 완벽",
        f"📅 {keyword} 2024년 트렌드 - 올해 핫한 선택",
        f"🌟 {keyword} 시즌별 가이드 - 언제가 최고?",
        f"🎊 {keyword} 특별한 순간 - 기억에 남는 선택",
        f"⏳ {keyword} 마지막 기회 - 놓치면 후회",
        
        # 문제 해결형
        f"❓ {keyword} 고민 해결 - 이제 끝!",
        f"🔧 {keyword} 문제 해결 - 100% 해결법",
        f"💊 {keyword} 고민 완치 - 더 이상 고민 NO",
        f"🎯 {keyword} 완벽 솔루션 - 원샷 해결",
        f"⚡ {keyword} 즉시 해결 - 당장 적용 가능",
        
        # 혜택/이점 강조형
        f"🎁 {keyword} 특별 혜택 - 지금만 기회",
        f"💰 {keyword} 비용 절약 - 돈 버는 방법",
        f"⏱️ {keyword} 시간 절약 - 효율성 극대화",
        f"🎯 {keyword} 성공 보장 - 실패 없는 방법",
        f"🏆 {keyword} 최고의 선택 - 1등의 비밀",
        
        # 개인화/경험형
        f"👤 {keyword} 나만의 스타일 - 개성 있는 선택",
        f"🎨 {keyword} DIY 가이드 - 직접 만들어보기",
        f"📝 {keyword} 체험 후기 - 솔직한 이야기",
        f"🎪 {keyword} 나의 경험 - 실제 사용기",
        f"💭 {keyword} 솔직 후기 - 좋은 점과 아쉬운 점",
        
        # 긴급성/한정성
        f"🚨 {keyword} 긴급 공지 - 놓치면 안 되는 정보",
        f"⏰ {keyword} 마감 임박 - 서둘러야 할 이유",
        f"🎯 {keyword} 한정 기회 - 지금만 특가",
        f"🔥 {keyword} 핫한 이슈 - 화제의 중심",
        f"⭐ {keyword} 베스트셀러 - 인기 1위",
        
        # 전문성 어필형
        f"👨‍💼 {keyword} 전문가 분석 - 깊이 있는 리뷰",
        f"🔬 {keyword} 과학적 접근 - 데이터로 증명",
        f"📚 {keyword} 완전 분석 - 모든 것 정리",
        f"🎓 {keyword} 마스터 클래스 - 전문가의 노하우",
        f"🏅 {keyword} 인증 완료 - 검증된 방법"
    ]
    
    # 검색량과 경쟁율에 따른 제목 선택 로직
    selected_titles = []
    
    # 검색량이 높으면 인기/트렌드 관련 제목 우선
    if search_volume > 10000:
        popular_templates = [t for t in title_templates if any(word in t for word in ['🔥', '⭐', '📈', '🎯', '🚀'])]
        selected_titles.extend(random.sample(popular_templates, 2))
    
    # 경쟁율이 낮으면 호기심/비밀 관련 제목 우선
    if competition_ratio < 0.5:
        curiosity_templates = [t for t in title_templates if any(word in t for word in ['✨', '💡', '비밀', '완벽', '꿀팁'])]
        selected_titles.extend(random.sample(curiosity_templates, 2))
    
    # 나머지는 랜덤 선택
    remaining_templates = [t for t in title_templates if t not in selected_titles]
    selected_titles.extend(random.sample(remaining_templates, 5 - len(selected_titles)))
    
    # 중복 제거 및 5개로 제한
    unique_titles = list(dict.fromkeys(selected_titles))[:5]
    
    # 5개가 안 되면 추가로 랜덤 선택
    while len(unique_titles) < 5:
        additional_template = random.choice(title_templates)
        if additional_template not in unique_titles:
            unique_titles.append(additional_template)
    
    return unique_titles[:5]

def format_number(num_str):
    """숫자 문자열을 읽기 쉬운 형태로 포맷팅"""
    if num_str == "<10" or num_str == "0":
        return num_str
    
    try:
        num = int(num_str)
        if num >= 10000:
            return f"{num/10000:.1f}만"
        elif num >= 1000:
            return f"{num/1000:.1f}천"
        else:
            return str(num)
    except:
        return num_str

def get_keyword_data(data, max_keywords=None):
    """키워드 검색 결과에서 데이터 추출"""
    if not data or 'keywordList' not in data:
        return []
    
    keywords = data['keywordList']
    if not keywords:
        return []
    
    # 최대 개수 제한
    if max_keywords:
        keywords = keywords[:max_keywords]
    
    keyword_data = []
    for i, keyword in enumerate(keywords):
        rel_keyword = keyword.get('relKeyword', '')
        
        # PC 검색량
        try:
            pc_count = int(keyword.get('monthlyPcQcCnt', '0')) if keyword.get('monthlyPcQcCnt', '0') != '<10' else 0
        except:
            pc_count = 0
        
        # 모바일 검색량
        try:
            mobile_count = int(keyword.get('monthlyMobileQcCnt', '0')) if keyword.get('monthlyMobileQcCnt', '0') != '<10' else 0
        except:
            mobile_count = 0
        
        # 총 검색량
        total_count = pc_count + mobile_count
        
        # 문서수 검색 (빠른 처리를 위해 제한적으로)
        print(f"  📄 '{rel_keyword}' 문서수 검색 중...", end=" ")
        try:
            document_count = search_document_count(rel_keyword)
            if document_count is None:
                document_count = 0
            print(f"✅ {document_count:,}개")
        except Exception as e:
            print(f"❌ 오류: {e}")
            document_count = 0
        
        # 경쟁율 계산 (문서수 / 월간총검색량)
        competition_ratio = 0
        if total_count > 0:
            competition_ratio = round(document_count / total_count, 2)
        
        # 블로그 제목 추천 생성
        print(f"  📝 '{rel_keyword}' 제목 추천 생성 중...", end=" ")
        try:
            blog_titles = generate_blog_titles(rel_keyword, total_count, competition_ratio)
            print(f"✅ {len(blog_titles)}개")
        except Exception as e:
            print(f"❌ 오류: {e}")
            blog_titles = [f"{rel_keyword} 관련 정보", f"{rel_keyword} 완벽 가이드", f"{rel_keyword} 추천", f"{rel_keyword} 후기", f"{rel_keyword} 리뷰"]
        
        keyword_data.append({
            '키워드': rel_keyword,
            'PC검색량': pc_count,
            '모바일검색량': mobile_count,
            '월간총검색량': total_count,
            '문서수': document_count,
            '경쟁율': competition_ratio,
            '추천제목1': blog_titles[0] if len(blog_titles) > 0 else '',
            '추천제목2': blog_titles[1] if len(blog_titles) > 1 else '',
            '추천제목3': blog_titles[2] if len(blog_titles) > 2 else '',
            '추천제목4': blog_titles[3] if len(blog_titles) > 3 else '',
            '추천제목5': blog_titles[4] if len(blog_titles) > 4 else ''
        })
        
        # API 호출 간격 조절 (빠른 처리)
        time.sleep(0.1)
    
    return keyword_data

def display_keyword_results(keyword_data, input_keywords):
    """키워드 검색 결과를 보기 좋게 출력"""
    if not keyword_data:
        print("검색 결과가 없습니다.")
        return
    
    # 입력한 키워드들을 리스트로 변환
    input_list = [kw.strip() for kw in input_keywords.split(',')]
    
    # 키워드를 검색량 순으로 정렬
    sorted_keywords = sorted(keyword_data, key=lambda x: x['월간총검색량'], reverse=True)
    
    print(f"\n입력한 키워드: {', '.join(input_list)}")
    print(f"총 {len(keyword_data)}개 키워드를 표시합니다.\n")
    print("=" * 150)
    print(f"{'키워드':<20} {'PC검색량':<12} {'모바일검색량':<12} {'월간총검색량':<12} {'문서수':<12} {'경쟁율':<10} {'추천제목':<60}")
    print("=" * 150)
    
    for keyword in sorted_keywords:
        rel_keyword = keyword['키워드']
        pc_qc = format_number(str(keyword['PC검색량']))
        mobile_qc = format_number(str(keyword['모바일검색량']))
        total_qc = format_number(str(keyword['월간총검색량']))
        doc_count = format_number(str(keyword['문서수']))
        competition = keyword['경쟁율']
        
        # 첫 번째 추천 제목만 표시 (공간 절약)
        first_title = keyword['추천제목1'][:55] + "..." if len(keyword['추천제목1']) > 55 else keyword['추천제목1']
        
        # 입력한 키워드인지 표시
        is_input = "★" if rel_keyword.upper() in [kw.upper() for kw in input_list] else " "
        
        print(f"{is_input}{rel_keyword:<19} {pc_qc:<12} {mobile_qc:<12} {total_qc:<12} {doc_count:<12} {competition:<10} {first_title:<60}")
    
    print("=" * 150)
    print("★ 표시: 입력하신 키워드")
    print("\n📝 전체 추천 제목을 보려면 엑셀 파일을 확인하세요!")

def save_to_excel(all_keyword_data, filename):
    """키워드 데이터를 엑셀 파일로 저장"""
    if not all_keyword_data:
        print("저장할 데이터가 없습니다.")
        return
    
    if PANDAS_AVAILABLE:
        # pandas를 사용한 엑셀 저장
        try:
            # DataFrame 생성
            df = pd.DataFrame(all_keyword_data)
            
            # 중복 제거 (키워드 기준)
            df_unique = df.drop_duplicates(subset=['키워드'], keep='first')
            
            # 검색량 순으로 정렬
            df_sorted = df_unique.sort_values('월간총검색량', ascending=False)
            
            # 엑셀 파일로 저장
            df_sorted.to_excel(filename, index=False, engine='openpyxl')
            print(f"\n결과가 {filename} 파일로 저장되었습니다.")
            print(f"총 {len(df_sorted)}개의 고유 키워드가 저장되었습니다.")
        except Exception as e:
            print(f"엑셀 파일 저장 중 오류가 발생했습니다: {e}")
            # pandas 실패 시 CSV로 대체
            save_to_csv(all_keyword_data, filename.replace('.xlsx', '.csv'))
    else:
        # pandas 없이 CSV로 저장
        csv_filename = filename.replace('.xlsx', '.csv')
        save_to_csv(all_keyword_data, csv_filename)

def save_to_csv(all_keyword_data, filename):
    """키워드 데이터를 CSV 파일로 저장"""
    if not all_keyword_data:
        print("저장할 데이터가 없습니다.")
        return
    
    # 중복 제거 (키워드 기준)
    unique_data = {}
    for data in all_keyword_data:
        keyword = data['키워드']
        if keyword not in unique_data:
            unique_data[keyword] = data
    
    # 검색량 순으로 정렬
    sorted_data = sorted(unique_data.values(), key=lambda x: x['월간총검색량'], reverse=True)
    
    try:
        with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
            fieldnames = ['키워드', 'PC검색량', '모바일검색량', '월간총검색량', '문서수', '경쟁율', 
                         '추천제목1', '추천제목2', '추천제목3', '추천제목4', '추천제목5']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for data in sorted_data:
                writer.writerow(data)
        
        print(f"\n결과가 {filename} 파일로 저장되었습니다.")
        print(f"총 {len(sorted_data)}개의 고유 키워드가 저장되었습니다.")
    except Exception as e:
        print(f"CSV 파일 저장 중 오류가 발생했습니다: {e}")

def main():
    """메인 함수"""
    # API 인증 정보
    API_KEY = "01000000005d84e573bf51b1af97bd55d80b4d161478ae089b8b686db032a1b9d3addb3ad3"
    SECRET_KEY = "AQAAAABdhOVzv1Gxr5e9VdgLTRYUk3Gl94kmw7v5tmIXJb3Rrg=="
    CUSTOMER_ID = 3495013
    
    # 사용자 입력 받기
    print("=" * 60)
    print("네이버 검색광고 API 키워드 검색량 조회 및 블로그 제목 추천 도구")
    print("=" * 60)
    
    # 명령행 인수가 있으면 사용, 없으면 사용자 입력 받기
    if len(sys.argv) >= 2:
        hint_keywords = sys.argv[1]
    else:
        print("\n검색할 키워드를 입력하세요.")
        print("예시: 꽃배달, flower, 꽃배달,flower,화환")
        hint_keywords = input("키워드: ").strip()
        
        if not hint_keywords:
            print("키워드를 입력해주세요.")
            sys.exit(1)
    
    # 조회할 키워드 개수 입력
    try:
        max_keywords = int(input(f"\n몇 개의 키워드를 조회하시겠습니까? (기본값: 20): ") or "20")
    except ValueError:
        max_keywords = 20
    
    print(f"\n키워드 검색 중: {hint_keywords}")
    print(f"최대 {max_keywords}개의 키워드를 조회합니다.")
    print("네이버 검색광고 API를 사용하여 관련 키워드와 검색량을 조회합니다...")
    print("각 키워드별로 블로그 제목 5개를 추천합니다...\n")
    
    # API 클라이언트 생성
    api = NaverSearchAdAPI(API_KEY, SECRET_KEY, CUSTOMER_ID)
    
    # 모든 키워드 데이터를 저장할 리스트
    all_keyword_data = []
    searched_keywords = set()  # 이미 검색한 키워드 추적
    initial_keywords = [kw.strip() for kw in hint_keywords.split(',')]  # 초기 키워드들
    
    # 초기 키워드들로만 검색 (무한 루프 방지)
    for i, current_keyword in enumerate(initial_keywords):
        # 목표 개수에 도달했으면 즉시 종료
        if len(all_keyword_data) >= max_keywords:
            print(f"\n🎯 목표 키워드 개수 {max_keywords}개에 도달했습니다!")
            break
            
        if current_keyword in searched_keywords:
            print(f"이미 검색한 키워드 '{current_keyword}' 건너뛰기")
            continue
        
        print(f"\n[{i+1}회차] 키워드 검색: {current_keyword}")
        searched_keywords.add(current_keyword)
        
        # 키워드 검색 실행
        result = api.search_keywords(current_keyword, show_detail=1)
        
        if result:
            # 남은 슬롯 계산
            remaining_slots = max_keywords - len(all_keyword_data)
            
            # 남은 슬롯만큼만 처리
            keyword_data = get_keyword_data(result, remaining_slots)
            
            if keyword_data:
                all_keyword_data.extend(keyword_data)
                
                # 현재 결과 표시
                display_keyword_results(keyword_data, current_keyword)
                
                print(f"현재까지 수집된 키워드: {len(all_keyword_data)}개")
                
                # 목표 개수에 도달했으면 종료
                if len(all_keyword_data) >= max_keywords:
                    print(f"\n🎯 목표 키워드 개수 {max_keywords}개에 도달했습니다!")
                    break
            else:
                print(f"'{current_keyword}'에 대한 검색 결과가 없습니다.")
        else:
            print(f"'{current_keyword}' 검색에 실패했습니다.")
        
        # API 호출 간격 조절
        time.sleep(0.5)
    
    # 최종 결과 저장
    if all_keyword_data:
        # 파일명 생성 (입력 키워드 기반)
        base_filename = hint_keywords.replace(',', '_').replace(' ', '_')
        filename = f"{base_filename}_제목추천.xlsx"
        
        print(f"\n{'='*60}")
        print("📊 최종 결과를 엑셀 파일로 저장 중...")
        save_to_excel(all_keyword_data, filename)
        
        # 최종 통계
        print(f"\n{'='*60}")
        print("✅ 검색 완료!")
        print(f"📈 총 검색한 키워드: {len(searched_keywords)}개")
        print(f"📊 총 수집된 데이터: {len(all_keyword_data)}개")
        print(f"📝 총 추천 제목: {len(all_keyword_data) * 5}개")
        print(f"💾 저장된 파일: {filename}")
        print(f"📁 파일 위치: {os.path.abspath(filename)}")
        print("\n🎯 엑셀 파일에서 각 키워드별 추천 제목 5개를 확인하세요!")
    else:
        print("❌ 수집된 데이터가 없습니다.")

if __name__ == "__main__":
    main()
