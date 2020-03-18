#!/usr/bin/python

import pandas as pd

# Confirmed cases
df = pd.read_csv('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv')

counts_df=df.drop(columns=["Province/State","Lat","Long"]).groupby(['Country/Region']).sum().transpose()
counts_df.rename(columns={'US':'United States', 'Congo (Brazzaville)':'Congo','Congo (Kinshasa)':'Dem. Rep. Congo','Korea, South':'Korea','Taiwan*':'Taiwan','occupied Palestinian territory':'Palestine'}, inplace=True)
counts_df.reset_index(inplace=True)
counts_df=pd.melt(counts_df, id_vars=['index'], value_vars=counts_df.keys()[1:])
counts_df.rename(columns={'index':'date','Country/Region':'country','value':'count'}, inplace=True)


# Deaths
df = pd.read_csv('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv')

deaths_df=df.drop(columns=["Province/State","Lat","Long"]).groupby(['Country/Region']).sum().transpose()
deaths_df.rename(columns={'US':'United States', 'Congo (Brazzaville)':'Congo','Congo (Kinshasa)':'Dem. Rep. Congo','Korea, South':'Korea','Taiwan*':'Taiwan','occupied Palestinian territory':'Palestine'}, inplace=True)
deaths_df.reset_index(inplace=True)
deaths_df=pd.melt(deaths_df, id_vars=['index'], value_vars=deaths_df.keys()[1:])
counts_df["deaths"] = deaths_df.value.tolist()

# Calculate days since case 100
counts_df["days100"]=counts_df['count'].ge(100).groupby(counts_df["country"]).cumsum().astype(int)-1

counts_df.to_csv("confirmed-and-dead.csv",index=False)
