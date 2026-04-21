#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
네이버 검색광고 API와 연관검색어를 활용한 키워드 검색량 조회 및 블로그 제목 추천 도구
월간총검색수와제목연관검색어까지.py

사용법:
    python 월간총검색수와제목연관검색어까지.py "검색할 키워드"
    python 월간총검색수와제목연관검색어까지.py "꽃배달,flower,화환"
"""

import hashlib
import hmac
import base64
import time
import requests
import json
import sys
import urllib.parse
from urllib.parse import quote
from datetime import datetime
import os
import csv
import random
import re

# BeautifulSoup import 시도
try:
    from bs4 import BeautifulSoup
    BS4_AVAILABLE = True
except ImportError:
    BS4_AVAILABLE = False
    print("BeautifulSoup4가 설치되지 않았습니다. pip install beautifulsoup4를 실행해주세요.")

# pandas가 없을 경우를 대비한 대체 함수들
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
    print("[OK] pandas가 정상적으로 로드되었습니다.")
except ImportError:
    PANDAS_AVAILABLE = False
    print("[WARNING] pandas가 설치되지 않았습니다. CSV 파일로 저장합니다.")
    print("[TIP] pandas를 설치하려면: pip install pandas openpyxl")

import os
from pathlib import Path

def _load_env():
    """프로젝트 루트의 .env.local 파일을 읽어 os.environ에 주입"""
    env_path = Path(__file__).parent / ".env.local"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())

_load_env()

def _require(name):
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"환경변수 {name}이(가) 설정되지 않았습니다. .env.local을 확인하세요.")
    return value

# 네이버 검색 API 클라이언트 정보 (문서수 검색용)
NAVER_CLIENT_ID = _require("NAVER_CLIENT_ID")
NAVER_CLIENT_SECRET = _require("NAVER_CLIENT_SECRET")

class NaverRelatedKeywordExtractor:
    """네이버 검색 결과에서 연관 검색어를 추출하는 클래스"""
    
    def __init__(self):
        self.base_url = "https://search.naver.com/search.naver"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    
    def search_naver(self, keyword):
        """
        네이버에서 키워드를 검색하고 HTML 응답을 반환
        
        Args:
            keyword (str): 검색할 키워드
            
        Returns:
            str: HTML 응답 (실패시 None)
        """
        try:
            # URL 인코딩 - 띄어쓰기와 특수문자 처리 개선
            encoded_keyword = urllib.parse.quote(keyword, safe='')
            url = f"{self.base_url}?query={encoded_keyword}"
            
            print(f"[SEARCH] 네이버 연관검색어 검색 중: {keyword}")
            
            # GET 요청
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            print(f"[OK] 연관검색어 응답 성공 (상태코드: {response.status_code})")
            return response.text
            
        except requests.exceptions.RequestException as e:
            print(f"[ERROR] 네이버 연관검색어 검색 요청 실패: {e}")
            return None
        except Exception as e:
            print(f"[ERROR] 예상치 못한 오류: {e}")
            return None
    
    def extract_related_keywords_from_html(self, html_content):
        """
        HTML에서 연관 검색어를 추출
        
        Args:
            html_content (str): 네이버 검색 결과 HTML
            
        Returns:
            list: 연관 검색어 리스트
        """
        if not html_content:
            return []
        
        # BeautifulSoup 사용 시도
        if BS4_AVAILABLE:
            return self._extract_with_beautifulsoup(html_content)
        else:
            # 정규식을 사용한 대체 방법
            return self._extract_with_regex(html_content)
    
    def _extract_with_beautifulsoup(self, html_content):
        """BeautifulSoup을 사용한 연관 검색어 추출"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            related_keywords = []
            
            # 연관 검색어 영역 찾기
            related_section = soup.find('div', class_='related_srch')
            
            if not related_section:
                print("[WARNING] 연관 검색어 섹션을 찾을 수 없습니다.")
                return []
            
            # 연관 검색어 리스트 찾기
            keyword_list = related_section.find('ul', class_='lst_related_srch')
            
            if not keyword_list:
                print("[WARNING] 연관 검색어 리스트를 찾을 수 없습니다.")
                return []
            
            # 각 연관 검색어 추출
            items = keyword_list.find_all('li', class_='item')
            
            for item in items:
                try:
                    # 키워드 링크 찾기
                    link = item.find('a', class_='keyword')
                    if link:
                        # 키워드 텍스트 추출
                        title_div = link.find('div', class_='tit')
                        if title_div:
                            keyword = title_div.get_text(strip=True)
                            if keyword:
                                related_keywords.append(keyword)
                                print(f"  [FOUND] 연관 검색어: {keyword}")
                except Exception as e:
                    print(f"  [WARNING] 키워드 추출 중 오류: {e}")
                    continue
            
            return related_keywords
            
        except Exception as e:
            print(f"[ERROR] BeautifulSoup 파싱 중 오류: {e}")
            return []
    
    def _extract_with_regex(self, html_content):
        """정규식을 사용한 연관 검색어 추출 (BeautifulSoup 대체)"""
        try:
            related_keywords = []
            
            # 연관 검색어 영역 찾기 (정규식)
            related_pattern = r'<div class="tit">([^<]+)</div>'
            matches = re.findall(related_pattern, html_content)
            
            for match in matches:
                keyword = match.strip()
                if keyword and len(keyword) > 0:
                    related_keywords.append(keyword)
                    print(f"  [FOUND] 연관 검색어: {keyword}")
            
            return related_keywords
            
        except Exception as e:
            print(f"[ERROR] 정규식 파싱 중 오류: {e}")
            return []
    
    def extract_related_keywords(self, keyword):
        """
        키워드로 네이버 검색 후 연관 검색어 추출
        
        Args:
            keyword (str): 검색할 키워드
            
        Returns:
            list: 연관 검색어 리스트
        """
        print(f"\n{'='*60}")
        print(f"[SEARCH] '{keyword}' 연관 검색어 추출 시작")
        print(f"{'='*60}")
        
        # 네이버 검색
        html_content = self.search_naver(keyword)
        
        if not html_content:
            print("[ERROR] HTML 내용을 가져올 수 없습니다.")
            return []
        
        # 연관 검색어 추출
        related_keywords = self.extract_related_keywords_from_html(html_content)
        
        if related_keywords:
            print(f"\n[OK] 총 {len(related_keywords)}개의 연관 검색어를 찾았습니다.")
        else:
            print("\n[WARNING] 연관 검색어를 찾을 수 없습니다.")
        
        return related_keywords

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
        # 띄어쓰기 포함 키워드를 전체로 처리
        result = self._search_single_keyword(hint_keywords, show_detail)
        
        # 띄어쓰기가 포함된 키워드가 API에서 실패하는 경우, 연관검색어로 대체
        if not result and ' ' in hint_keywords:
            print(f"⚠️ 띄어쓰기 포함 키워드 '{hint_keywords}'가 API에서 지원되지 않습니다.")
            print("🔄 연관검색어를 활용하여 대체 키워드를 찾습니다...")
            
            # 연관검색어 추출기로 대체 키워드 찾기
            related_extractor = NaverRelatedKeywordExtractor()
            related_keywords = related_extractor.extract_related_keywords(hint_keywords)
            
            # 연관검색어 중에서 API로 검색 가능한 키워드 찾기
            for related_keyword in related_keywords:
                if ' ' not in related_keyword:  # 띄어쓰기가 없는 키워드만 시도
                    print(f"🔍 대체 키워드로 시도: '{related_keyword}'")
                    result = self._search_single_keyword(related_keyword, show_detail)
                    if result and result.get('keywordList'):
                        print(f"✅ 대체 키워드 '{related_keyword}'로 성공!")
                        break
        
        return result
    
    def _search_single_keyword(self, keyword, show_detail=1):
        """단일 키워드로 API 검색"""
        uri = "/keywordstool"
        
        # 띄어쓰기 제거하고 붙여서 처리
        if ' ' in keyword:
            # 띄어쓰기 제거하고 붙여서 처리
            clean_keyword = keyword.replace(' ', '')
            print(f"[PROCESS] 띄어쓰기 제거하여 처리: '{keyword}' -> '{clean_keyword}'")
            hint_keywords = clean_keyword
        else:
            hint_keywords = keyword
        
        # 네이버 검색 API 예제 방식으로 URL 인코딩
        enc_keyword = urllib.parse.quote(hint_keywords)
        
        # 쿼리 파라미터 설정
        params = {
            'hintKeywords': enc_keyword,
            'showDetail': show_detail
        }
        
        # URL 인코딩 - 네이버 API 표준 방식 사용
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
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
    
    # 키워드를 URL 인코딩 - 띄어쓰기와 특수문자 처리 개선
    encText = urllib.parse.quote(keyword, safe='')
    
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
        print(f"  [DOC] '{rel_keyword}' 문서수 검색 중...", end=" ")
        try:
            document_count = search_document_count(rel_keyword)
            if document_count is None:
                document_count = 0
            print(f"[OK] {document_count:,}개")
        except Exception as e:
            print(f"[ERROR] 오류: {e}")
            document_count = 0
        
        # 경쟁율 계산 (문서수 / 월간총검색량)
        competition_ratio = 0
        if total_count > 0:
            competition_ratio = round(document_count / total_count, 2)
        
        keyword_data.append({
            '키워드': rel_keyword,
            'PC검색량': pc_count,
            '모바일검색량': mobile_count,
            '월간총검색량': total_count,
            '문서수': document_count,
            '경쟁율': competition_ratio
        })
        
        # API 호출 간격 조절 (빠른 처리)
        time.sleep(0.1)
    
    return keyword_data

def get_related_keywords_for_supplement(original_keywords, target_count, current_count):
    """
    키워드 부족 시 연관검색어로 보완하는 함수
    
    Args:
        original_keywords (list): 원본 키워드 리스트
        target_count (int): 목표 키워드 수
        current_count (int): 현재 수집된 키워드 수
        
    Returns:
        list: 추가로 수집할 키워드 리스트
    """
    needed_count = target_count - current_count
    if needed_count <= 0:
        return []
    
    print(f"\n[INFO] 키워드 부족! {needed_count}개 더 필요합니다.")
    print("[INFO] 연관검색어를 활용하여 추가 키워드를 수집합니다...")
    
    related_extractor = NaverRelatedKeywordExtractor()
    additional_keywords = []
    
    # 원본 키워드들로부터 연관검색어 수집
    for keyword in original_keywords:
        if len(additional_keywords) >= needed_count:
            break
            
        print(f"\n[SEARCH] '{keyword}' 연관검색어 수집 중...")
        related_keywords = related_extractor.extract_related_keywords(keyword)
        
        # 중복 제거하면서 추가
        for related_keyword in related_keywords:
            if related_keyword not in additional_keywords and len(additional_keywords) < needed_count:
                additional_keywords.append(related_keyword)
                print(f"  [ADD] 추가 키워드: {related_keyword}")
        
        # API 호출 간격 조절
        time.sleep(1)
    
    return additional_keywords[:needed_count]

def display_keyword_results(keyword_data, input_keywords):
    """키워드 검색 결과를 보기 좋게 출력"""
    if not keyword_data:
        print("검색 결과가 없습니다.")
        return
    
    # 입력한 키워드들을 리스트로 변환 - 띄어쓰기 처리 개선
    input_list = [kw.strip() for kw in input_keywords.split(',') if kw.strip()]
    
    # 키워드를 검색량 순으로 정렬
    sorted_keywords = sorted(keyword_data, key=lambda x: x['월간총검색량'], reverse=True)
    
    print(f"\n입력한 키워드: {', '.join(input_list)}")
    print(f"총 {len(keyword_data)}개 키워드를 표시합니다.\n")
    print("=" * 100)
    print(f"{'키워드':<20} {'PC검색량':<12} {'모바일검색량':<12} {'월간총검색량':<12} {'문서수':<12} {'경쟁율':<10}")
    print("=" * 100)
    
    for keyword in sorted_keywords:
        rel_keyword = keyword['키워드']
        pc_qc = format_number(str(keyword['PC검색량']))
        mobile_qc = format_number(str(keyword['모바일검색량']))
        total_qc = format_number(str(keyword['월간총검색량']))
        doc_count = format_number(str(keyword['문서수']))
        competition = keyword['경쟁율']
        
        # 입력한 키워드인지 표시
        is_input = "★" if rel_keyword.upper() in [kw.upper() for kw in input_list] else " "
        
        print(f"{is_input}{rel_keyword:<19} {pc_qc:<12} {mobile_qc:<12} {total_qc:<12} {doc_count:<12} {competition:<10}")
    
    print("=" * 100)
    print("★ 표시: 입력하신 키워드")

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
            fieldnames = ['키워드', 'PC검색량', '모바일검색량', '월간총검색량', '문서수', '경쟁율']
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
    # API 인증 정보 (.env.local에서 로드)
    API_KEY = _require("NAVER_SEARCH_AD_API_KEY")
    SECRET_KEY = _require("NAVER_SEARCH_AD_SECRET_KEY")
    CUSTOMER_ID = _require("NAVER_SEARCH_AD_CUSTOMER_ID")
    
    # 사용자 입력 받기
    print("=" * 60)
    print("네이버 검색광고 API + 연관검색어 키워드 검색량 조회 및 블로그 제목 추천 도구")
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
    
    # 조회할 키워드 개수 입력 (명령행 인수 또는 기본값)
    if len(sys.argv) >= 3:
        try:
            max_keywords = int(sys.argv[2])
        except ValueError:
            max_keywords = 20
    else:
        try:
            max_keywords = int(input(f"\n몇 개의 키워드를 조회하시겠습니까? (기본값: 20): ") or "20")
        except (ValueError, EOFError):
            max_keywords = 20
    
    print(f"\n키워드 검색 중: {hint_keywords}")
    print(f"최대 {max_keywords}개의 키워드를 조회합니다.")
    print("네이버 검색광고 API를 사용하여 관련 키워드와 검색량을 조회합니다...")
    print("키워드가 부족할 경우 연관검색어를 활용하여 보완합니다...\n")
    
    # API 클라이언트 생성
    api = NaverSearchAdAPI(API_KEY, SECRET_KEY, CUSTOMER_ID)
    
    # 모든 키워드 데이터를 저장할 리스트
    all_keyword_data = []
    searched_keywords = set()  # 이미 검색한 키워드 추적
    initial_keywords = [kw.strip() for kw in hint_keywords.split(',') if kw.strip()]  # 초기 키워드들 - 띄어쓰기 처리 개선
    
    # 1단계: 초기 키워드들로 검색
    print("=" * 60)
    print("1단계: 초기 키워드 검색")
    print("=" * 60)
    
    for i, current_keyword in enumerate(initial_keywords):
        # 목표 개수에 도달했으면 즉시 종료
        if len(all_keyword_data) >= max_keywords:
            print(f"\n[TARGET] 목표 키워드 개수 {max_keywords}개에 도달했습니다!")
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
                    print(f"\n[TARGET] 목표 키워드 개수 {max_keywords}개에 도달했습니다!")
                    break
            else:
                print(f"'{current_keyword}'에 대한 검색 결과가 없습니다.")
        else:
            print(f"'{current_keyword}' 검색에 실패했습니다.")
        
        # API 호출 간격 조절
        time.sleep(0.5)
    
    # 2단계: 키워드가 부족한 경우 연관검색어로 보완
    if len(all_keyword_data) < max_keywords:
        print("\n" + "=" * 60)
        print("2단계: 연관검색어로 키워드 보완")
        print("=" * 60)
        
        # 연관검색어로 추가 키워드 수집
        additional_keywords = get_related_keywords_for_supplement(
            initial_keywords, max_keywords, len(all_keyword_data)
        )
        
        # 추가 키워드들로 검색
        for additional_keyword in additional_keywords:
            if len(all_keyword_data) >= max_keywords:
                break
                
            if additional_keyword in searched_keywords:
                continue
                
            print(f"\n[SEARCH] 추가 키워드 검색: {additional_keyword}")
            searched_keywords.add(additional_keyword)
            
            # 키워드 검색 실행
            result = api.search_keywords(additional_keyword, show_detail=1)
            
            if result:
                # 남은 슬롯 계산
                remaining_slots = max_keywords - len(all_keyword_data)
                
                # 남은 슬롯만큼만 처리
                keyword_data = get_keyword_data(result, remaining_slots)
                
                if keyword_data:
                    all_keyword_data.extend(keyword_data)
                    print(f"현재까지 수집된 키워드: {len(all_keyword_data)}개")
                    
                    # 목표 개수에 도달했으면 종료
                    if len(all_keyword_data) >= max_keywords:
                        print(f"\n[TARGET] 목표 키워드 개수 {max_keywords}개에 도달했습니다!")
                        break
                else:
                    print(f"'{additional_keyword}'에 대한 검색 결과가 없습니다.")
            else:
                print(f"'{additional_keyword}' 검색에 실패했습니다.")
            
            # API 호출 간격 조절
            time.sleep(0.5)
    
    # 최종 결과 저장
    if all_keyword_data:
        # 파일명 생성 (검색한날짜_입력한키워드.xlsx 형식)
        import re
        from datetime import datetime
        
        # 현재 날짜를 YYYYMMDD 형식으로 생성
        current_date = datetime.now().strftime("%Y%m%d")
        
        # 입력 키워드에서 첫 번째 키워드만 사용 (쉼표로 구분된 경우)
        first_keyword = hint_keywords.split(',')[0].strip()
        
        # 특수문자 제거 및 정리
        clean_keyword = re.sub(r'[^\w\s-]', '', first_keyword)  # 특수문자 제거
        clean_keyword = re.sub(r'[-\s]+', '', clean_keyword)  # 띄어쓰기와 하이픈 제거
        
        filename = f"{current_date}_{clean_keyword}.xlsx"
        
        print(f"\n{'='*60}")
        print("[SAVE] 최종 결과를 엑셀 파일로 저장 중...")
        save_to_excel(all_keyword_data, filename)
        
        # 최종 통계
        print(f"\n{'='*60}")
        print("[SUCCESS] 검색 완료!")
        print(f"[STAT] 총 검색한 키워드: {len(searched_keywords)}개")
        print(f"[STAT] 총 수집된 데이터: {len(all_keyword_data)}개")
        print(f"[FILE] 저장된 파일: {filename}")
        print(f"[PATH] 파일 위치: {os.path.abspath(filename)}")
        print("[INFO] 연관검색어를 활용하여 목표 키워드 수를 달성했습니다!")
    else:
        print("[ERROR] 수집된 데이터가 없습니다.")

if __name__ == "__main__":
    main()

